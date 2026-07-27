import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
/** Intervalle entre deux passages, en minutes (RELANCE_INTERVALLE_MINUTES, defaut 30, borne [5;720]). */
const INTERVALLE_MINUTES = (() => {
  const brut = Number((process.env.RELANCE_INTERVALLE_MINUTES ?? '').trim() || '30');
  if (!Number.isFinite(brut)) return 30;
  return Math.min(720, Math.max(5, brut));
})();
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
export class MissionsScheduler implements OnModuleInit, OnModuleDestroy {
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

  private minuteur: ReturnType<typeof setInterval> | null = null;

  /** Demarre la boucle sans dependance externe : simple setInterval natif. */
  onModuleInit(): void {
    this.minuteur = setInterval(() => {
      void this.relancerMissionsNonPourvues();
    }, INTERVALLE_MINUTES * 60_000);
    // Ne bloque pas l'arret du process pendant les tests / scripts.
    if (typeof this.minuteur === 'object' && 'unref' in this.minuteur) this.minuteur.unref();
  }

  onModuleDestroy(): void {
    if (this.minuteur) clearInterval(this.minuteur);
  }

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

    const lien = `/dashboard/missions/${mission.id}`;
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

    const palierCourant = mission.visibility;
    const typeRepere = `${TYPE_RELANCE}${palierCourant}`;
    if (await this.repereExiste(proprietaireId, typeRepere, lien)) {
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
    if (await this.repereExiste(proprietaireId, TYPE_ALERTE, lien)) return false;

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
  private async repereExiste(userId: string, type: string, lien: string): Promise<boolean> {
    const existant = await this.prisma.notification.findFirst({
      where: { userId, type, link: lien },
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
