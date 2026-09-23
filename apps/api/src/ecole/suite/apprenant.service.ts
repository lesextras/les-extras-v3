import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { StatutCours, StatutInscriptionCours } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../common/mail/mail.service';
import { EmailsEcoleService } from './emails-ecole.service';
import { emettreSession, jetonLien, lireSession, type SessionApprenant } from './session-apprenant';
import type {
  ChangerMotDePasseDto,
  ChoisirMotDePasseDto,
  ConnexionApprenantDto,
  ProfilApprenantDto,
} from './suite.dto';

const TOURS_BCRYPT = 12;
const HEURE = 3600 * 1000;

/**
 * L'ESPACE APPRENANT.
 *
 * Comme sur Teachizy, chaque école a son espace : on s'y connecte avec son
 * adresse et un mot de passe, et l'on y retrouve toutes ses formations, le
 * calendrier et la communauté. Le lien personnel de chaque formation reste
 * valable : le compte ne remplace rien, il réunit.
 *
 * ⚠ AUCUNE RÉPONSE NE DIT SI UNE ADRESSE EST CONNUE. « Recevoir mon lien »
 * répond toujours la même chose : sinon la page servirait à tester quelles
 * personnes suivent quelles formations.
 */
@Injectable()
export class ApprenantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly emails: EmailsEcoleService,
  ) {}

  /* ═══════════════════════════════════════════════════ l'école ══════ */

  /** Ce que la page de connexion affiche : le nom, la couleur, le logo. */
  async ecoleParSlug(slug: string) {
    const e = await this.prisma.ecoleEnLigne.findUnique({
      where: { slug },
      select: { accountId: true, nom: true, slug: true, couleur: true, logoUrl: true, sousTitre: true },
    });
    if (!e) throw new NotFoundException('Cette école n’existe pas.');
    const r = await this.prisma.reglagesEcole.findUnique({ where: { accountId: e.accountId } });
    return {
      ...e,
      communauteActive: Boolean(r?.communauteActive),
      calendrierVisible: r ? r.calendrierVisible : true,
    };
  }

  /* ═══════════════════════════════════════════ connexion et liens ══════ */

  /**
   * « Recevoir mon lien » : crée le compte s'il n'existe pas encore, pour une
   * personne qui suit au moins une formation de l'école, et lui envoie le lien
   * qui choisit (ou change) son mot de passe. Même réponse dans tous les cas.
   */
  async demanderLien(slug: string, emailBrut: string) {
    const ecole = await this.ecoleParSlug(slug);
    const email = emailBrut.trim().toLowerCase();
    let compte = await this.prisma.compteApprenant.findUnique({
      where: { accountId_email: { accountId: ecole.accountId, email } },
    });
    if (!compte) {
      const inscription = await this.prisma.inscriptionCours.findFirst({
        where: { email, cours: { accountId: ecole.accountId } },
        select: { prenom: true, nom: true },
      });
      if (inscription) {
        compte = await this.prisma.compteApprenant.create({
          data: { accountId: ecole.accountId, email, prenom: inscription.prenom, nom: inscription.nom },
        });
      }
    }
    if (compte) {
      const jeton = jetonLien();
      await this.prisma.compteApprenant.update({
        where: { id: compte.id },
        data: { jetonReinit: jeton, jetonReinitExpire: new Date(Date.now() + HEURE) },
      });
      const racine = await this.emails.racine(ecole.accountId);
      await this.mail.sendEcoleLibre({
        to: email,
        ecole: { nom: ecole.nom, couleur: ecole.couleur },
        sujet: compte.motDePasse ? `Changer votre mot de passe · ${ecole.nom}` : `Créer votre espace apprenant · ${ecole.nom}`,
        titre: compte.motDePasse ? 'Choisir un nouveau mot de passe' : 'Votre espace apprenant',
        texte: `Bonjour${compte.prenom ? ` ${compte.prenom}` : ''},\n\nLe bouton ci-dessous vous permet de ${
          compte.motDePasse ? 'choisir un nouveau mot de passe' : 'choisir votre mot de passe et d’ouvrir votre espace apprenant'
        } chez ${ecole.nom}. Il est valable une heure.\n\nSi vous n’êtes pas à l’origine de cette demande, ignorez ce message : rien ne change.`,
        bouton: { label: compte.motDePasse ? 'Choisir mon mot de passe' : 'Créer mon espace', url: `${racine}/ecole/${ecole.slug}/mot-de-passe?jeton=${jeton}` },
      });
    }
    return { envoye: true };
  }

  async choisirMotDePasse(slug: string, dto: ChoisirMotDePasseDto) {
    const ecole = await this.ecoleParSlug(slug);
    const compte = await this.prisma.compteApprenant.findUnique({ where: { jetonReinit: dto.jeton } });
    if (!compte || compte.accountId !== ecole.accountId || !compte.jetonReinitExpire || compte.jetonReinitExpire < new Date()) {
      throw new BadRequestException('Ce lien a expiré. Demandez-en un nouveau depuis la page de connexion.');
    }
    const maj = await this.prisma.compteApprenant.update({
      where: { id: compte.id },
      data: {
        motDePasse: await bcrypt.hash(dto.motDePasse, TOURS_BCRYPT),
        jetonReinit: null,
        jetonReinitExpire: null,
        versionSession: { increment: 1 },
        derniereConnexion: new Date(),
      },
    });
    return { sessionApprenant: emettreSession(maj.id, maj.accountId, maj.versionSession) };
  }

  async connexion(slug: string, dto: ConnexionApprenantDto) {
    const ecole = await this.ecoleParSlug(slug);
    const email = dto.email.trim().toLowerCase();
    const compte = await this.prisma.compteApprenant.findUnique({
      where: { accountId_email: { accountId: ecole.accountId, email } },
    });
    // Même message pour une adresse inconnue et un mot de passe faux.
    const refus = new UnauthorizedException(
      'Adresse ou mot de passe incorrect. Première connexion ? Cliquez sur « Recevoir mon lien ».',
    );
    if (!compte?.motDePasse) throw refus;
    if (!(await bcrypt.compare(dto.motDePasse, compte.motDePasse))) throw refus;
    await this.prisma.compteApprenant.update({ where: { id: compte.id }, data: { derniereConnexion: new Date() } });
    return { sessionApprenant: emettreSession(compte.id, compte.accountId, compte.versionSession) };
  }

  /* ═════════════════════════════════════════════════ la session ══════ */

  /** Le compte derrière un jeton de session, ou une 401. */
  async compteDeSession(jeton: string | undefined) {
    const s: SessionApprenant | null = lireSession(jeton);
    if (!s) throw new UnauthorizedException('Connectez-vous à votre espace apprenant.');
    const compte = await this.prisma.compteApprenant.findUnique({ where: { id: s.c } });
    if (!compte || compte.accountId !== s.a || compte.versionSession !== s.v) {
      throw new UnauthorizedException('Votre session a expiré : reconnectez-vous.');
    }
    return compte;
  }

  /** Le compte s'il y en a un — pour les pages qui s'ouvrent aussi sans. */
  async compteSiSession(jeton: string | undefined) {
    try {
      return await this.compteDeSession(jeton);
    } catch {
      return null;
    }
  }

  /* ═══════════════════════════════════════════════ l'espace ══════ */

  /** L'accueil de l'espace : le profil, les formations, les classes à venir. */
  async moi(jeton: string | undefined) {
    const compte = await this.compteDeSession(jeton);
    const ecole = await this.prisma.ecoleEnLigne.findUnique({
      where: { accountId: compte.accountId },
      select: { nom: true, slug: true, couleur: true, logoUrl: true },
    });
    const reglages = await this.prisma.reglagesEcole.findUnique({ where: { accountId: compte.accountId } });
    const inscriptions = await this.inscriptionsDe(compte.accountId, compte.email);
    const coursIds = inscriptions.map((i) => i.coursId);
    const reglagesCours = await this.prisma.reglageCours.findMany({ where: { coursId: { in: coursIds } } });
    const duree = new Map(reglagesCours.map((r) => [r.coursId, r.dureeAccesJours]));
    const rendus = await this.prisma.renduDevoir.groupBy({
      by: ['inscriptionId', 'statut'],
      where: { inscriptionId: { in: inscriptions.map((i) => i.id) } },
      _count: { _all: true },
    });

    return {
      apprenant: { email: compte.email, prenom: compte.prenom, nom: compte.nom },
      ecole: {
        ...(ecole ?? { nom: '', slug: '', couleur: '#0F5F3E', logoUrl: null }),
        communauteActive: Boolean(reglages?.communauteActive),
        calendrierVisible: reglages ? reglages.calendrierVisible : true,
      },
      formations: inscriptions.map((i) => {
        const jours = duree.get(i.coursId) ?? null;
        const expireLe = jours ? new Date(i.createdAt.getTime() + jours * 24 * HEURE) : null;
        return {
          id: i.id,
          coursId: i.coursId,
          titre: i.cours.titre,
          sousTitre: i.cours.sousTitre,
          imageUrl: i.cours.imageUrl,
          progression: i.progression,
          statut: i.statut,
          termineLe: i.termineLe,
          inscritLe: i.createdAt,
          derniereVisite: i.derniereVisite,
          expireLe,
          expire: Boolean(expireLe && expireLe < new Date()),
          lien: `/apprendre/${i.jeton}`,
          devoirs: {
            aCorriger: rendus.filter((r) => r.inscriptionId === i.id && r.statut === 'A_CORRIGER').reduce((t, r) => t + r._count._all, 0),
            aReprendre: rendus.filter((r) => r.inscriptionId === i.id && r.statut === 'A_REPRENDRE').reduce((t, r) => t + r._count._all, 0),
          },
        };
      }),
      catalogue: await this.catalogue(compte.accountId, coursIds),
    };
  }

  async modifierProfil(jeton: string | undefined, dto: ProfilApprenantDto) {
    const compte = await this.compteDeSession(jeton);
    await this.prisma.compteApprenant.update({
      where: { id: compte.id },
      data: {
        ...(dto.prenom !== undefined ? { prenom: dto.prenom.trim() || null } : {}),
        ...(dto.nom !== undefined ? { nom: dto.nom.trim() || null } : {}),
      },
    });
    return { enregistre: true };
  }

  async changerMotDePasse(jeton: string | undefined, dto: ChangerMotDePasseDto) {
    const compte = await this.compteDeSession(jeton);
    if (!compte.motDePasse || !(await bcrypt.compare(dto.actuel, compte.motDePasse))) {
      throw new ForbiddenException('Le mot de passe actuel ne correspond pas.');
    }
    const maj = await this.prisma.compteApprenant.update({
      where: { id: compte.id },
      data: { motDePasse: await bcrypt.hash(dto.nouveau, TOURS_BCRYPT), versionSession: { increment: 1 } },
    });
    return { sessionApprenant: emettreSession(maj.id, maj.accountId, maj.versionSession) };
  }

  /**
   * LE CALENDRIER DE L'APPRENANT.
   *
   * Trois sources, comme chez Teachizy : les événements de l'école (tous, ou
   * ceux de ses formations), les classes virtuelles de ses formations, et les
   * dates où ses leçons à ouverture différée s'ouvrent.
   */
  async calendrier(jeton: string | undefined) {
    const compte = await this.compteDeSession(jeton);
    const reglages = await this.prisma.reglagesEcole.findUnique({ where: { accountId: compte.accountId } });
    if (reglages && !reglages.calendrierVisible) return { visible: false, elements: [] };

    const inscriptions = await this.inscriptionsDe(compte.accountId, compte.email);
    const coursIds = inscriptions.filter((i) => i.statut !== StatutInscriptionCours.SUSPENDUE).map((i) => i.coursId);
    const depuis = new Date(Date.now() - 31 * 24 * HEURE);

    const [evenements, classes, cours] = await Promise.all([
      this.prisma.evenementEcole.findMany({
        where: { accountId: compte.accountId, debut: { gte: depuis }, OR: [{ coursIds: { isEmpty: true } }, { coursIds: { hasSome: coursIds } }] },
        orderBy: { debut: 'asc' },
        take: 200,
      }),
      this.prisma.classeVirtuelle.findMany({
        where: { accountId: compte.accountId, debut: { gte: depuis }, OR: [{ coursId: null }, { coursId: { in: coursIds } }] },
        include: { salle: { select: { id: true } }, cours: { select: { titre: true } } },
        orderBy: { debut: 'asc' },
        take: 200,
      }),
      this.prisma.cours.findMany({
        where: { id: { in: coursIds } },
        select: {
          id: true,
          titre: true,
          chapitres: { where: { publie: true }, select: { ouvertureJours: true, lecons: { where: { publie: true }, select: { id: true, titre: true, ouvertureJours: true } } } },
          leconsRacine: { where: { publie: true }, select: { id: true, titre: true, ouvertureJours: true } },
        },
      }),
    ]);

    const deblocages = inscriptions.flatMap((i) => {
      const c = cours.find((x) => x.id === i.coursId);
      if (!c) return [];
      const lecons = [
        ...c.chapitres.flatMap((ch) => ch.lecons.map((l) => ({ ...l, jours: Math.max(l.ouvertureJours, ch.ouvertureJours) }))),
        ...c.leconsRacine.map((l) => ({ ...l, jours: l.ouvertureJours })),
      ].filter((l) => l.jours > 0);
      return lecons.map((l) => ({
        genre: 'lecon' as const,
        id: `${i.id}:${l.id}`,
        titre: `Ouverture de « ${l.titre} »`,
        sousTitre: c.titre,
        debut: new Date(i.createdAt.getTime() + l.jours * 24 * HEURE).toISOString(),
        fin: null as string | null,
        lien: `/apprendre/${i.jeton}`,
        lieu: null as string | null,
      }));
    });

    const elements = [
      ...evenements.map((e) => ({
        genre: 'evenement' as const,
        id: e.id,
        titre: e.titre,
        sousTitre: e.description,
        debut: e.debut.toISOString(),
        fin: e.fin?.toISOString() ?? null,
        lien: e.lien,
        lieu: e.lieu,
      })),
      ...classes.map((c) => ({
        genre: 'classe' as const,
        id: c.id,
        titre: c.titre,
        sousTitre: c.cours?.titre ?? c.description,
        debut: c.debut.toISOString(),
        fin: c.fin?.toISOString() ?? null,
        // La salle intégrée passe avant un lien externe.
        lien: c.salle ? `/classe/${c.id}` : c.lien,
        lieu: null as string | null,
      })),
      ...deblocages,
    ].sort((a, b) => a.debut.localeCompare(b.debut));

    return { visible: true, elements };
  }

  /* ═══════════════════════════════════════════════ les outils ══════ */

  inscriptionsDe(accountId: string, email: string) {
    return this.prisma.inscriptionCours.findMany({
      where: { email, cours: { accountId } },
      include: { cours: { select: { titre: true, sousTitre: true, imageUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Les autres formations publiées de l'école : ce que Teachizy montre sous « Mes formations ». */
  private async catalogue(accountId: string, dejaSuivis: string[]) {
    const cours = await this.prisma.cours.findMany({
      where: { accountId, statut: StatutCours.PUBLIE, id: { notIn: dejaSuivis } },
      select: { titre: true, slug: true, sousTitre: true, imageUrl: true, prixCents: true, gratuit: true },
      orderBy: { ordre: 'asc' },
      take: 12,
    });
    return cours;
  }
}
