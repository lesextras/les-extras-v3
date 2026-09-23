import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Prisma, StatutInscriptionCours, TypeEmailEcole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../common/mail/mail.service';
import { MODELES_PAR_DEFAUT, MODELE_PAR_TYPE, dateFr, remplir, type DonneesEmail } from './modeles-email';
import type { ModeleEmailDto } from './suite.dto';

/**
 * LES COURRIELS AUTOMATIQUES DE L'ÉCOLE.
 *
 * Deux sortes de déclencheurs, comme chez Teachizy :
 *
 *  - une ACTION (inscription, suspension, retrait…) : le service qui la fait
 *    appelle `programmer`, et le message part après le délai choisi ;
 *  - un ÉTAT qui se constate (formation finie, leçon ouverte, apprenant qui
 *    décroche, achat abandonné, accès expiré, lundi matin) : le passage
 *    régulier le relève dans la base et programme ce qui manque.
 *
 * ⚠ JAMAIS DEUX FOIS LE MÊME MESSAGE. Chaque envoi porte une clé (type +
 * inscription + ce qui l'a déclenché) unique en base : relancer le passage,
 * redémarrer le serveur ou rejouer une action ne double rien.
 *
 * ⚠ RIEN AVANT LE LANCEMENT. Les états constatés ne remontent pas avant la
 * date de mise en service : une académie qui ouvre la page ne déclenche pas
 * d'un coup la relance de tous ses anciens apprenants.
 */
export const MISE_EN_SERVICE = new Date('2026-09-24T00:00:00.000Z');

const MINUTE = 60_000;

@Injectable()
export class EmailsEcoleService {
  private readonly logger = new Logger(EmailsEcoleService.name);
  private enCours = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  /* ═════════════════════════════════════════════════════ l'écran ══════ */

  /** Les quatorze messages de l'académie : son texte s'il l'a écrit, sinon celui par défaut. */
  async lister(accountId: string) {
    const [lignes, envois] = await Promise.all([
      this.prisma.modeleEmailEcole.findMany({ where: { accountId } }),
      this.prisma.envoiEmailEcole.groupBy({
        by: ['type'],
        where: { accountId, envoyeLe: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) } },
        _count: { _all: true },
      }),
    ]);
    const parType = new Map(lignes.map((l) => [l.type, l]));
    const compte = new Map(envois.map((e) => [e.type, e._count._all]));
    return MODELES_PAR_DEFAUT.map((d) => {
      const l = parType.get(d.type);
      return {
        type: d.type,
        libelle: d.libelle,
        declencheur: d.declencheur,
        delaiReglable: d.delaiReglable,
        actif: l ? l.actif : true,
        sujet: l?.sujet ?? d.sujet,
        corps: l?.corps ?? d.corps,
        delaiMinutes: l ? l.delaiMinutes : d.delaiMinutes,
        personnalise: Boolean(l),
        parDefaut: { sujet: d.sujet, corps: d.corps, delaiMinutes: d.delaiMinutes },
        envoyes30j: compte.get(d.type) ?? 0,
      };
    });
  }

  async modifier(accountId: string, type: TypeEmailEcole, dto: ModeleEmailDto) {
    const d = MODELE_PAR_TYPE.get(type);
    if (!d) throw new NotFoundException("Ce courriel n'existe pas.");
    await this.prisma.modeleEmailEcole.upsert({
      where: { accountId_type: { accountId, type } },
      create: {
        accountId,
        type,
        actif: dto.actif ?? true,
        sujet: dto.sujet?.trim() || d.sujet,
        corps: dto.corps?.trim() || d.corps,
        delaiMinutes: d.delaiReglable ? (dto.delaiMinutes ?? d.delaiMinutes) : 0,
      },
      update: {
        ...(dto.actif !== undefined ? { actif: dto.actif } : {}),
        ...(dto.sujet !== undefined ? { sujet: dto.sujet.trim() || d.sujet } : {}),
        ...(dto.corps !== undefined ? { corps: dto.corps.trim() || d.corps } : {}),
        ...(dto.delaiMinutes !== undefined && d.delaiReglable ? { delaiMinutes: dto.delaiMinutes } : {}),
      },
    });
    return (await this.lister(accountId)).find((m) => m.type === type);
  }

  /** Revenir au texte par défaut : on efface la version de l'académie. */
  async reinitialiser(accountId: string, type: TypeEmailEcole) {
    await this.prisma.modeleEmailEcole.deleteMany({ where: { accountId, type } });
    return (await this.lister(accountId)).find((m) => m.type === type);
  }

  /** Un essai, avec des valeurs d'exemple, à l'adresse que donne l'académie. */
  async tester(accountId: string, type: TypeEmailEcole, email: string) {
    const ecole = await this.ecole(accountId);
    const racine = await this.racine(accountId);
    await this.envoyer(accountId, type, email, {
      prenom: 'Camille',
      formation: 'Exemple de formation',
      lecon: 'Exemple de leçon',
      ecole: ecole.nom,
      lien: `${racine}/ecole/${ecole.slug ?? ''}`,
      date: dateFr(new Date()),
      liste: '• Exemple de formation : 40 %',
    }, { forcer: true, prefixeSujet: '[Essai] ' });
    return { envoye: true };
  }

  /* ══════════════════════════════════════════════════ programmer ══════ */

  /**
   * Programme un message déclenché par une action. Renvoie faux quand
   * l'académie l'a désactivé : l'appelant sait alors qu'il n'est pas parti.
   *
   * @param du  L'heure de l'action (défaut : maintenant). Le délai du modèle
   *            s'y ajoute, sauf si `duExact` est donné.
   */
  async programmer(p: {
    accountId: string;
    type: TypeEmailEcole;
    email: string;
    cle: string;
    donnees: DonneesEmail;
    du?: Date;
    duExact?: Date;
  }): Promise<boolean> {
    const modele = await this.modele(p.accountId, p.type);
    if (!modele.actif) return false;
    const du = p.duExact ?? new Date((p.du ?? new Date()).getTime() + modele.delaiMinutes * MINUTE);
    try {
      await this.prisma.emailProgramme.create({
        data: {
          accountId: p.accountId,
          type: p.type,
          email: p.email.toLowerCase(),
          cle: p.cle,
          du,
          donnees: p.donnees as Prisma.InputJsonValue,
        },
      });
    } catch (e) {
      // Clé déjà prise : ce message est déjà programmé ou parti. Rien à faire.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return true;
      throw e;
    }
    // Sans délai, on n'attend pas le prochain passage.
    if (du.getTime() <= Date.now()) void this.traiterDus();
    return true;
  }

  /** Vrai quand le courriel de bienvenue de l'académie est actif. */
  async actif(accountId: string, type: TypeEmailEcole): Promise<boolean> {
    return (await this.modele(accountId, type)).actif;
  }

  /* ═════════════════════════════════════════════ le passage régulier ══════ */

  @Cron(process.env.EMAILS_ECOLE_CRON ?? '*/10 * * * *', { name: 'emails-ecole', timeZone: 'Europe/Paris' })
  async passage() {
    if (this.enCours) return;
    this.enCours = true;
    try {
      await this.constaterAbandons();
      await this.constaterFins();
      await this.constaterLecons();
      await this.constaterExpirations();
      await this.constaterDecrochages();
      await this.constaterRecapitulatifs();
      await this.traiterDus();
    } catch (e) {
      this.logger.error(`[emails-ecole] passage interrompu : ${(e as Error).message}`);
    } finally {
      this.enCours = false;
    }
  }

  /** Envoie ce qui est dû. Trois échecs, et on laisse tomber ce message. */
  async traiterDus() {
    const dus = await this.prisma.emailProgramme.findMany({
      where: { envoyeLe: null, du: { lte: new Date() }, echecs: { lt: 3 } },
      orderBy: { du: 'asc' },
      take: 80,
    });
    for (const d of dus) {
      // On réserve la ligne : un deuxième passage simultané ne la reprend pas.
      const pris = await this.prisma.emailProgramme.updateMany({
        where: { id: d.id, envoyeLe: null },
        data: { envoyeLe: new Date() },
      });
      if (!pris.count) continue;
      try {
        // Le modèle a pu être désactivé entre la programmation et l'envoi.
        if (!(await this.actif(d.accountId, d.type))) continue;
        await this.envoyer(d.accountId, d.type, d.email, d.donnees as DonneesEmail);
        await this.prisma.envoiEmailEcole.create({
          data: { accountId: d.accountId, type: d.type, cle: d.cle, email: d.email },
        }).catch(() => undefined);
      } catch (e) {
        await this.prisma.emailProgramme.update({
          where: { id: d.id },
          data: { envoyeLe: null, echecs: { increment: 1 } },
        });
        this.logger.warn(`[emails-ecole] ${d.type} → échec : ${(e as Error).message}`);
      }
    }
  }

  /* ───────────────────────────────────────────── les états constatés ── */

  /** L'achat ouvert, jamais payé : deux relances, à l'heure puis au lendemain. */
  private async constaterAbandons() {
    const paniers = await this.prisma.panierCours.findMany({
      where: { payeLe: null, createdAt: { gte: new Date(Date.now() - 10 * 24 * 3600 * 1000) } },
      take: 200,
    });
    for (const p of paniers) {
      const vente = await this.prisma.venteCours.findUnique({ where: { stripeSessionId: p.stripeSessionId }, select: { id: true } });
      const inscrit = await this.prisma.inscriptionCours.findUnique({
        where: { coursId_email: { coursId: p.coursId, email: p.email } },
        select: { id: true },
      });
      if (vente || inscrit) {
        await this.prisma.panierCours.update({ where: { id: p.id }, data: { payeLe: new Date() } });
        continue;
      }
      const cours = await this.prisma.cours.findUnique({ where: { id: p.coursId }, select: { titre: true, slug: true } });
      if (!cours) continue;
      const ecole = await this.ecole(p.accountId);
      const racine = await this.racine(p.accountId);
      const donnees: DonneesEmail = {
        prenom: p.nom?.split(' ')[0] ?? null,
        formation: cours.titre,
        ecole: ecole.nom,
        lien: `${racine}/cours/${cours.slug}`,
      };
      for (const type of ['ABANDON_1', 'ABANDON_2'] as const) {
        const m = await this.modele(p.accountId, type);
        if (!m.actif) continue;
        if (Date.now() < p.createdAt.getTime() + m.delaiMinutes * MINUTE) continue;
        await this.programmer({ accountId: p.accountId, type, email: p.email, cle: `${type}:${p.id}`, donnees, duExact: new Date() });
      }
    }
  }

  /** Une formation finie depuis la mise en service. */
  private async constaterFins() {
    const finies = await this.prisma.inscriptionCours.findMany({
      where: { termineLe: { gte: MISE_EN_SERVICE } },
      include: { cours: { select: { titre: true, accountId: true } } },
      orderBy: { termineLe: 'desc' },
      take: 300,
    });
    for (const i of finies) {
      await this.programmer({
        accountId: i.cours.accountId,
        type: 'FIN_FORMATION',
        email: i.email,
        cle: `FIN_FORMATION:${i.id}`,
        du: i.termineLe ?? new Date(),
        donnees: await this.donneesInscription(i.cours.accountId, i.cours.titre, i.prenom, i.jeton),
      });
    }
  }

  /** Une leçon à ouverture différée qui vient de s'ouvrir. */
  private async constaterLecons() {
    const inscriptions = await this.prisma.inscriptionCours.findMany({
      where: {
        statut: StatutInscriptionCours.ACTIVE,
        createdAt: { gte: new Date(MISE_EN_SERVICE.getTime() - 400 * 24 * 3600 * 1000) },
        cours: {
          OR: [
            { chapitres: { some: { OR: [{ ouvertureJours: { gt: 0 } }, { lecons: { some: { ouvertureJours: { gt: 0 } } } }] } } },
            { leconsRacine: { some: { ouvertureJours: { gt: 0 } } } },
          ],
        },
      },
      include: {
        cours: {
          select: {
            titre: true,
            accountId: true,
            chapitres: { where: { publie: true }, select: { ouvertureJours: true, lecons: { where: { publie: true }, select: { id: true, titre: true, ouvertureJours: true } } } },
            leconsRacine: { where: { publie: true }, select: { id: true, titre: true, ouvertureJours: true } },
          },
        },
      },
      take: 500,
    });
    const maintenant = Date.now();
    for (const i of inscriptions) {
      const lecons = [
        ...i.cours.chapitres.flatMap((c) => c.lecons.map((l) => ({ ...l, jours: Math.max(l.ouvertureJours, c.ouvertureJours) }))),
        ...i.cours.leconsRacine.map((l) => ({ ...l, jours: l.ouvertureJours })),
      ].filter((l) => l.jours > 0);
      for (const l of lecons) {
        const ouvre = i.createdAt.getTime() + l.jours * 24 * 3600 * 1000;
        if (ouvre > maintenant || ouvre < MISE_EN_SERVICE.getTime()) continue;
        const donnees = await this.donneesInscription(i.cours.accountId, i.cours.titre, i.prenom, i.jeton);
        await this.programmer({
          accountId: i.cours.accountId,
          type: 'LECON_ACCESSIBLE',
          email: i.email,
          cle: `LECON_ACCESSIBLE:${i.id}:${l.id}`,
          du: new Date(ouvre),
          donnees: { ...donnees, lecon: l.titre },
        });
      }
    }
  }

  /** L'accès à durée limitée qui prend fin. */
  private async constaterExpirations() {
    const reglages = await this.prisma.reglageCours.findMany({
      where: { dureeAccesJours: { not: null } },
      include: { cours: { select: { id: true, titre: true, accountId: true } } },
    });
    for (const r of reglages) {
      const jours = r.dureeAccesJours ?? 0;
      if (!jours) continue;
      const limite = new Date(Date.now() - jours * 24 * 3600 * 1000);
      const echues = await this.prisma.inscriptionCours.findMany({
        where: { coursId: r.coursId, createdAt: { lte: limite, gte: new Date(MISE_EN_SERVICE.getTime() - jours * 24 * 3600 * 1000) } },
        take: 300,
      });
      for (const i of echues) {
        const fin = new Date(i.createdAt.getTime() + jours * 24 * 3600 * 1000);
        const donnees = await this.donneesInscription(r.cours.accountId, r.cours.titre, i.prenom, i.jeton);
        await this.programmer({
          accountId: r.cours.accountId,
          type: 'EXPIRATION_ACCES',
          email: i.email,
          cle: `EXPIRATION_ACCES:${i.id}:${fin.toISOString().slice(0, 10)}`,
          du: fin,
          donnees: { ...donnees, date: dateFr(fin) },
        });
      }
    }
  }

  /** L'apprenant qui n'ouvre plus sa formation. Une relance par période d'absence. */
  private async constaterDecrochages() {
    const actives = await this.prisma.inscriptionCours.findMany({
      where: { statut: StatutInscriptionCours.ACTIVE, progression: { lt: 100 }, createdAt: { gte: MISE_EN_SERVICE } },
      include: { cours: { select: { titre: true, accountId: true } } },
      take: 800,
    });
    const maintenant = Date.now();
    for (const i of actives) {
      const derniere = (i.derniereVisite ?? i.createdAt).getTime();
      for (const type of ['DECROCHAGE_1', 'DECROCHAGE_2'] as const) {
        const m = await this.modele(i.cours.accountId, type);
        if (!m.actif || !m.delaiMinutes) continue;
        const du = derniere + m.delaiMinutes * MINUTE;
        if (du > maintenant) continue;
        await this.programmer({
          accountId: i.cours.accountId,
          type,
          email: i.email,
          // La période d'absence fait partie de la clé : une personne qui
          // revient puis repart peut être relancée à nouveau, jamais deux
          // fois pour la même absence.
          cle: `${type}:${i.id}:${Math.floor(derniere / (24 * 3600 * 1000))}`,
          duExact: new Date(du),
          donnees: await this.donneesInscription(i.cours.accountId, i.cours.titre, i.prenom, i.jeton),
        });
      }
    }
  }

  /** Le lundi matin : un seul message par personne et par école, toutes formations réunies. */
  private async constaterRecapitulatifs() {
    const maintenant = new Date();
    const paris = new Date(maintenant.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
    if (paris.getDay() !== 1 || paris.getHours() < 8) return;
    const semaine = semaineIso(paris);
    const actives = await this.prisma.inscriptionCours.findMany({
      where: { statut: StatutInscriptionCours.ACTIVE, progression: { lt: 100 }, createdAt: { gte: MISE_EN_SERVICE } },
      include: { cours: { select: { titre: true, accountId: true } } },
      take: 2000,
    });
    const groupes = new Map<string, typeof actives>();
    for (const i of actives) {
      const k = `${i.cours.accountId}|${i.email}`;
      groupes.set(k, [...(groupes.get(k) ?? []), i]);
    }
    for (const [k, liste] of groupes) {
      const [accountId, email] = k.split('|');
      const ecole = await this.ecole(accountId);
      const racine = await this.racine(accountId);
      await this.programmer({
        accountId,
        type: 'RECAPITULATIF',
        email,
        cle: `RECAPITULATIF:${accountId}:${email}:${semaine}`,
        duExact: new Date(),
        donnees: {
          prenom: liste[0].prenom,
          ecole: ecole.nom,
          liste: liste.map((i) => `• ${i.cours.titre} : ${i.progression} %`).join('\n'),
          lien: ecole.slug ? `${racine}/ecole/${ecole.slug}/espace` : `${racine}/apprendre/${liste[0].jeton}`,
        },
      });
    }
  }

  /* ══════════════════════════════════════════════════════ l'envoi ══════ */

  private async envoyer(
    accountId: string,
    type: TypeEmailEcole,
    email: string,
    donnees: DonneesEmail,
    options?: { forcer?: boolean; prefixeSujet?: string },
  ) {
    const m = await this.modele(accountId, type);
    if (!m.actif && !options?.forcer) return;
    const ecole = await this.ecole(accountId);
    const d = { ...donnees, ecole: donnees.ecole || ecole.nom };
    const defaut = MODELE_PAR_TYPE.get(type);
    const sujet = `${options?.prefixeSujet ?? ''}${remplir(m.sujet, d)}`;
    await this.mail.sendEcoleLibre({
      to: email,
      ecole: { nom: ecole.nom, couleur: ecole.couleur },
      sujet,
      titre: remplir(m.sujet, d),
      texte: remplir(m.corps, d),
      bouton: defaut?.bouton && d.lien ? { label: defaut.bouton, url: d.lien } : null,
    });
  }

  /** Le modèle en vigueur : celui de l'académie, sinon le texte par défaut. */
  private async modele(accountId: string, type: TypeEmailEcole) {
    const d = MODELE_PAR_TYPE.get(type)!;
    const l = await this.prisma.modeleEmailEcole.findUnique({ where: { accountId_type: { accountId, type } } });
    return {
      actif: l ? l.actif : true,
      sujet: l?.sujet ?? d.sujet,
      corps: l?.corps ?? d.corps,
      delaiMinutes: l ? l.delaiMinutes : d.delaiMinutes,
    };
  }

  private async ecole(accountId: string) {
    const e = await this.prisma.ecoleEnLigne.findUnique({
      where: { accountId },
      select: { nom: true, couleur: true, slug: true },
    });
    if (e) return e;
    const a = await this.prisma.account.findUnique({ where: { id: accountId }, select: { name: true } });
    return { nom: a?.name ?? 'Votre organisme de formation', couleur: '#0F5F3E', slug: null as string | null };
  }

  /** L'adresse de l'école : son domaine vérifié, sinon celle de Piloter. */
  async racine(accountId: string): Promise<string> {
    const r = await this.prisma.reglagesEcole.findUnique({
      where: { accountId },
      select: { domaine: true, domaineVerifieLe: true },
    });
    if (r?.domaine && r.domaineVerifieLe) return `https://${r.domaine}`;
    return (process.env.PILOTE_WEB_URL ?? 'https://pilote.toulali.fr').replace(/\/$/, '');
  }

  private async donneesInscription(accountId: string, formation: string, prenom: string | null, jeton: string): Promise<DonneesEmail> {
    const racine = await this.racine(accountId);
    return { prenom, formation, lien: `${racine}/apprendre/${jeton}` };
  }
}

function semaineIso(d: Date): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const jour = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - jour);
  const debut = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const n = Math.ceil(((t.getTime() - debut.getTime()) / 86_400_000 + 1) / 7);
  return `${t.getUTCFullYear()}-S${String(n).padStart(2, '0')}`;
}
