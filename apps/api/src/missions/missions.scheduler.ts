import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MissionVisibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MissionsService } from './missions.service';

/**
 * Relance automatique des missions de renfort non pourvues.
 *
 * Problème traité : une mission SOS Renfort publiée que personne n'accepte
 * restait en l'état indéfiniment — aucun élargissement du périmètre de
 * diffusion, aucun rappel aux intervenants, aucune alerte à l'établissement.
 *
 * Principe : toutes les 30 minutes (configurable), on parcourt les missions
 * encore ouvertes (PUBLISHED, date de début à venir) et on applique deux
 * mécaniques indépendantes :
 *   1. RELANCE       — au bout de RELANCE_APRES_HEURES sans être pourvue, on
 *                      élargit la diffusion d'un cran via `MissionsService.broaden()`
 *                      (la cascade SALARIES -> RESERVED -> PUBLIC n'est PAS
 *                      réimplémentée ici) puis on renvoie l'offre aux
 *                      intervenants correspondants.
 *   2. ALERTE        — quand la mission arrive à moins de ALERTE_AVANT_HEURES
 *                      de son début sans être pourvue, on prévient l'établissement.
 *
 * Garde-fou anti-doublon (sans modification du schéma Prisma) : chaque action
 * dépose un « repère » dans la table Notification de l'établissement, dont le
 * `type` encode le palier concerné (MISSION_RELANCE_SALARIES,
 * MISSION_RELANCE_RESERVED, MISSION_RELANCE_PUBLIC, MISSION_ALERTE_ECHEANCE)
 * et dont le `link` identifie la mission. Avant d'agir on vérifie l'absence de
 * ce repère : une mission n'est donc jamais relancée deux fois pour le même
 * palier de diffusion, ni alertée deux fois. Un second garde-fou temporel
 * s'appuie sur `updatedAt` (que `broaden()` met à jour) pour espacer d'au
 * moins RELANCE_APRES_HEURES deux paliers successifs.
 *
 * Robustesse : chaque mission est traitée dans son propre try/catch, le nombre
 * de missions traitées par passage est borné, et aucune exception ne remonte
 * hors de la tâche planifiée (elle ne peut donc pas faire tomber l'API).
 */

/** Préfixe des repères de relance ; suffixé par le palier de diffusion. */
const TYPE_RELANCE = 'MISSION_RELANCE_';
/** Repère de l'alerte « mission imminente non pourvue ». */
const TYPE_ALERTE = 'MISSION_ALERTE_ECHEANCE';

/**
 * L'expression cron est lue depuis process.env : les décorateurs sont évalués
 * à l'import du module, avant que le conteneur Nest (et donc ConfigService)
 * ne soit disponible. Défaut : toutes les 30 minutes.
 */
const EXPRESSION_CRON =
  (process.env.RELANCE_CRON ?? '').trim() || CronExpression.EVERY_30_MINUTES;

/** Libellés lisibles des paliers de diffusion (messages en français). */
const LIBELLE_PALIER: Record<MissionVisibility, string> = {
  [MissionVisibility.SALARIES]: 'vos salariés',
  [MissionVisibility.RESERVED]: 'vos intervenants réservés',
  [MissionVisibility.PUBLIC]: 'toute la marketplace',
};

interface BilanMission {
  elargie: boolean;
  rediffusee: boolean;
  alertee: boolean;
}

@Injectable()
export class MissionsScheduler {
  private readonly logger = new Logger(MissionsScheduler.name);

  /**
   * Garde-fou de ré-entrance : empêche deux passages simultanés au sein d'une
   * même instance (passage long + cron qui retombe).
   */
  private enCours = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly missions: MissionsService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
  ) {}

  // ── Configuration ────────────────────────────────────────────────────────

  /** Lecture d'une variable d'environnement, ConfigService puis process.env. */
  private lireEnv(cle: string): string | undefined {
    const valeur = this.config.get<string>(cle) ?? process.env[cle];
    if (valeur === undefined || valeur === null) return undefined;
    const texte = String(valeur).trim();
    return texte === '' ? undefined : texte;
  }

  private lireNombre(cle: string, defaut: number, min: number, max: number): number {
    const brut = this.lireEnv(cle);
    if (brut === undefined) return defaut;
    const n = Number(brut);
    if (!Number.isFinite(n)) {
      this.logger.warn(`${cle}="${brut}" illisible — valeur par défaut ${defaut} appliquée.`);
      return defaut;
    }
    return Math.min(Math.max(n, min), max);
  }

  /** SCHEDULER_ENABLED=false coupe la tâche sans redéployer de code. */
  private get actif(): boolean {
    const brut = (this.lireEnv('SCHEDULER_ENABLED') ?? 'true').toLowerCase();
    return !['false', '0', 'off', 'non'].includes(brut);
  }

  /** Délai après publication (ou après le dernier palier) avant relance. */
  private get relanceApresHeures(): number {
    return this.lireNombre('RELANCE_APRES_HEURES', 6, 0.25, 720);
  }

  /** Fenêtre avant la date de début qui déclenche l'alerte établissement. */
  private get alerteAvantHeures(): number {
    return this.lireNombre('ALERTE_AVANT_HEURES', 24, 0.25, 720);
  }

  /**
   * Délai minimal après publication avant d'alerter l'établissement. Évite
   * d'alerter immédiatement une mission publiée quelques heures seulement
   * avant son début (cas typique d'un renfort de dernière minute).
   */
  private get alerteMinPublicationHeures(): number {
    return this.lireNombre('ALERTE_MIN_PUBLICATION_HEURES', 1, 0, 720);
  }

  /** Nombre maximal de missions examinées par passage. */
  private get maxParPassage(): number {
    return Math.round(this.lireNombre('RELANCE_MAX_PAR_PASSAGE', 50, 1, 500));
  }

  // ── Tâche planifiée ──────────────────────────────────────────────────────

  /**
   * Missions recurrentes (HEBDO) : quand la date de debut d'une mission
   * recurrente est passee, l'occurrence de la semaine suivante est creee et
   * publiee automatiquement. La recurrence est transferee a la nouvelle
   * occurrence (l'ancienne est fermee) : la chaine avance d'une semaine a la
   * fois, sans doublon possible, et s'arrete des que l'etablissement retire
   * la recurrence de l'occurrence courante.
   */
  @Cron(CronExpression.EVERY_HOUR, { name: 'missions-recurrentes' })
  async traiterRecurrences(): Promise<void> {
    if (!this.actif) return;
    const dues = await this.prisma.reliefMission.findMany({
      where: { recurrence: 'HEBDO', startDate: { lt: new Date() }, status: { not: 'CANCELLED' } },
      take: 20,
      include: { account: { select: { ownerId: true } } },
    });
    for (const mission of dues) {
      try {
        // 1. L'ancienne occurrence sort de la chaine AVANT toute creation :
        //    en cas d'echec plus loin, on ne cree jamais deux copies.
        await this.prisma.reliefMission.update({
          where: { id: mission.id },
          data: { recurrence: null },
        });
        // 2. Nouvelle occurrence : brouillon date +7 jours, recurrence reprise.
        const copie = await this.missions.dupliquer(mission.id, mission.accountId);
        await this.prisma.reliefMission.update({
          where: { id: copie.id },
          data: { recurrence: 'HEBDO' },
        });
        // 3. Publication automatique (cascade habituelle).
        await this.missions.publish(copie.id, mission.accountId);
        if (mission.account?.ownerId) {
          await this.notifications.create(mission.account.ownerId, {
            type: 'MISSION_RECURRENTE',
            title: 'Mission récurrente republiée',
            body: `« ${mission.title} » a été republiée pour la semaine prochaine.`,
            link: '/dashboard/renforts',
          });
        }
      } catch (e) {
        this.logger.warn(
          `Récurrence non traitée pour la mission ${mission.id}: ${(e as Error).message}`,
        );
      }
    }
  }

  /**
   * Rappel J-1 : la veille d'une mission confirmee, l'intervenant et
   * l'etablissement recoivent une notification (cloche + push). Fenetre
   * glissante d'une heure ([J-1, J-1 + 1 h)) parcourue toutes les heures :
   * chaque reservation n'est rappelee qu'une fois, avec un repere
   * anti-doublon dans la table Notification (type RAPPEL_J1).
   */
  @Cron(CronExpression.EVERY_HOUR, { name: 'rappels-j-1' })
  async rappelerVeilleDeMission(): Promise<void> {
    if (!this.actif) return;
    const debut = new Date(Date.now() + 23 * 3_600_000);
    const fin = new Date(Date.now() + 24 * 3_600_000);
    const reservations = await this.prisma.booking.findMany({
      where: {
        status: { in: ['ACCEPTED', 'CONFIRMED'] },
        mission: { startDate: { gte: debut, lt: fin } },
      },
      take: 100,
      include: {
        account: { select: { ownerId: true } },
        mission: {
          select: { title: true, startDate: true, startTime: true, city: true, account: { select: { ownerId: true } } },
        },
      },
    });
    for (const r of reservations) {
      try {
        const lien = `/dashboard/reservations#${r.id}`;
        const deja = await this.prisma.notification.findFirst({
          where: { type: 'RAPPEL_J1', link: lien },
          select: { id: true },
        });
        if (deja || !r.mission) continue;
        const quand = `${new Date(r.mission.startDate).toLocaleDateString('fr-FR')}${r.mission.startTime ? ` à ${r.mission.startTime}` : ''}`;
        const destinataires = new Set<string>();
        if (r.account?.ownerId) destinataires.add(r.account.ownerId);
        if (r.mission.account?.ownerId) destinataires.add(r.mission.account.ownerId);
        for (const userId of destinataires) {
          await this.notifications.create(userId, {
            type: 'RAPPEL_J1',
            title: 'Mission demain',
            body: `Rappel : « ${r.mission.title} » commence demain (${quand}${r.mission.city ? `, ${r.mission.city}` : ''}).`,
            link: lien,
          });
        }
      } catch (e) {
        this.logger.warn(`Rappel J-1 non envoyé (booking ${r.id}): ${(e as Error).message}`);
      }
    }
  }

  @Cron(EXPRESSION_CRON, { name: 'relance-missions-non-pourvues' })
  async relancerMissionsNonPourvues(): Promise<void> {
    if (!this.actif) {
      this.logger.debug('Relance désactivée (SCHEDULER_ENABLED=false) — passage ignoré.');
      return;
    }
    if (this.enCours) {
      this.logger.warn('Passage précédent encore en cours — celui-ci est ignoré.');
      return;
    }

    this.enCours = true;
    const demarre = Date.now();
    const maintenant = new Date();
    let examinees = 0;
    let elargies = 0;
    let rediffusees = 0;
    let alertes = 0;
    let erreurs = 0;

    try {
      const missions = await this.missions.listerMissionsOuvertes({
        limite: this.maxParPassage,
        maintenant,
      });
      examinees = missions.length;

      for (const mission of missions) {
        try {
          const bilan = await this.traiterMission(mission, maintenant);
          if (bilan.elargie) elargies += 1;
          if (bilan.rediffusee) rediffusees += 1;
          if (bilan.alertee) alertes += 1;
        } catch (e) {
          erreurs += 1;
          const err = e as Error;
          // Une mission en erreur ne doit jamais interrompre le passage.
          this.logger.error(
            `Relance impossible pour la mission ${mission.id} : ${err?.message ?? e}`,
            err?.stack,
          );
        }
      }
    } catch (e) {
      // Filet de sécurité ultime : la tâche de fond ne doit rien laisser fuir.
      const err = e as Error;
      this.logger.error(
        `Passage de relance interrompu : ${err?.message ?? e}`,
        err?.stack,
      );
    } finally {
      this.enCours = false;
      const duree = Date.now() - demarre;
      this.logger.log(
        `Relance des missions — ${examinees} examinée(s), ${elargies} élargie(s), ` +
          `${rediffusees} rediffusée(s), ${alertes} alerte(s), ${erreurs} erreur(s) en ${duree} ms.`,
      );
    }
  }

  // ── Traitement d'une mission ─────────────────────────────────────────────

  private async traiterMission(
    mission: Awaited<ReturnType<MissionsService['listerMissionsOuvertes']>>[number],
    maintenant: Date,
  ): Promise<BilanMission> {
    const bilan: BilanMission = { elargie: false, rediffusee: false, alertee: false };

    const proprietaireId = mission.account?.ownerId ?? null;
    if (!proprietaireId) {
      // Sans destinataire, impossible de déposer le repère anti-doublon :
      // on s'abstient plutôt que de risquer des envois en boucle.
      this.logger.warn(
        `Mission ${mission.id} sans propriétaire de compte — relance ignorée (anti-doublon impossible).`,
      );
      return bilan;
    }

    const lien = `/dashboard/renforts#${mission.id}`;
    const publieeLe = mission.publishedAt ?? mission.createdAt;
    const heuresDepuisPublication = this.heuresEntre(publieeLe, maintenant);
    const heuresDepuisMaj = this.heuresEntre(mission.updatedAt, maintenant);
    const heuresAvantDebut = this.heuresEntre(maintenant, mission.startDate);

    // 1) Alerte échéance — la mission démarre bientôt et n'est toujours pas pourvue.
    if (
      heuresAvantDebut <= this.alerteAvantHeures &&
      heuresDepuisPublication >= this.alerteMinPublicationHeures
    ) {
      bilan.alertee = await this.alerterEtablissement(
        proprietaireId,
        mission,
        lien,
        heuresAvantDebut,
      );
    }

    // 2) Relance — publiée depuis assez longtemps, et palier stable depuis autant.
    const seuil = this.relanceApresHeures;
    if (heuresDepuisPublication < seuil || heuresDepuisMaj < seuil) return bilan;

    // Une mission adressée nominativement ne se relance pas toute seule : ni
    // élargissement, ni rediffusion. L'établissement a demandé que l'offre
    // reste entre les personnes qu'il a désignées, et cette demande survit à
    // l'absence de réponse — c'est à lui, et à lui seul, de l'ouvrir.
    if (mission.cibleDiffusion !== 'RESEAU') return bilan;

    const palierCourant = mission.visibility;
    const typeRepere = `${TYPE_RELANCE}${palierCourant}`;
    if (await this.repereExiste(proprietaireId, typeRepere, mission.id)) {
      // Déjà relancée pour ce palier : on ne relance jamais deux fois.
      return bilan;
    }

    const palierSuivant = MissionsService.visibiliteSuivante(palierCourant);

    // Le repère est déposé AVANT toute action : si l'envoi échoue ou si une
    // seconde instance passe au même moment, la mission ne sera pas relancée
    // deux fois pour ce palier.
    await this.notifications.create(proprietaireId, {
      type: typeRepere,
      title: palierSuivant ? 'Mission relancée — diffusion élargie' : 'Mission relancée',
      body: palierSuivant
        ? `« ${mission.title} » n'est toujours pas pourvue après ${Math.round(
            heuresDepuisPublication,
          )} h. La diffusion vient d'être élargie à ${LIBELLE_PALIER[palierSuivant]} et l'offre a été renvoyée aux intervenants correspondants.`
        : `« ${mission.title} » n'est toujours pas pourvue après ${Math.round(
            heuresDepuisPublication,
          )} h. L'offre vient d'être renvoyée aux intervenants correspondants de ${LIBELLE_PALIER[palierCourant]}.`,
      link: lien,
    });

    if (palierSuivant) {
      // On réutilise la logique de cascade existante — jamais de duplication.
      await this.missions.broaden(mission.id, mission.accountId);
      bilan.elargie = true;
      this.logger.log(
        `Mission ${mission.id} — diffusion élargie ${palierCourant} -> ${palierSuivant}.`,
      );
    }

    const notifies = await this.missions.rediffuserAuxIntervenants(
      mission.id,
      mission.accountId,
    );
    bilan.rediffusee = true;
    this.logger.log(
      `Mission ${mission.id} — relance envoyée à ${notifies} intervenant(s) (palier ${
        palierSuivant ?? palierCourant
      }).`,
    );

    return bilan;
  }

  // ── Alerte établissement ─────────────────────────────────────────────────

  private async alerterEtablissement(
    proprietaireId: string,
    mission: { id: string; title: string; startDate: Date; startTime: string | null; city: string | null },
    lien: string,
    heuresAvantDebut: number,
  ): Promise<boolean> {
    if (await this.repereExiste(proprietaireId, TYPE_ALERTE, mission.id)) return false;

    const quand = this.formatDateFr(mission.startDate);
    const heures = Math.max(0, Math.round(heuresAvantDebut));
    await this.notifications.create(proprietaireId, {
      type: TYPE_ALERTE,
      title: 'Mission non pourvue — échéance proche',
      body:
        `« ${mission.title} » démarre dans ${heures} h (${quand}${
          mission.startTime ? ` à ${mission.startTime}` : ''
        }${mission.city ? `, ${mission.city}` : ''}) et aucun intervenant ne l'a acceptée. ` +
        `Ajustez la rémunération, les horaires ou contactez directement un intervenant.`,
      link: lien,
    });
    this.logger.warn(
      `Mission ${mission.id} — alerte échéance envoyée à l'établissement (${heures} h avant le début).`,
    );
    return true;
  }

  // ── Garde-fou anti-doublon ───────────────────────────────────────────────

  /**
   * Un « repère » est une notification déjà déposée pour ce couple
   * (établissement, type d'action, mission). Sa présence signifie que l'action
   * a déjà été effectuée : on ne la rejoue pas.
   */
  /**
   * Le repère anti-doublon se cherche sur l'identifiant de la mission, pas sur
   * l'URL complète. La nuance compte : le jour où l'on corrige un lien — ce qui
   * vient d'arriver, `/dashboard/missions/:id` n'ayant jamais existé — les
   * repères déjà posés continuent de compter. Sans cela, toutes les missions en
   * cours auraient été relancées une fois de plus le lendemain du correctif.
   */
  private async repereExiste(userId: string, type: string, missionId: string): Promise<boolean> {
    const existant = await this.prisma.notification.findFirst({
      where: { userId, type, link: { contains: missionId } },
      select: { id: true },
    });
    return existant !== null;
  }

  // ── Utilitaires ──────────────────────────────────────────────────────────

  private heuresEntre(debut: Date, fin: Date): number {
    return (new Date(fin).getTime() - new Date(debut).getTime()) / 3_600_000;
  }

  private formatDateFr(d: Date): string {
    try {
      return new Date(d).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return new Date(d).toISOString().slice(0, 10);
    }
  }
}
