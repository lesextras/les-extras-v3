import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PartageAgenda, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AgendaService } from '../agenda/agenda.service';
import type { CreerRendezVousDto, ModifierRendezVousDto } from '../agenda/dto/agenda.dto';
import { MailService } from '../common/mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { RequestAccount, RequestUser } from '../common/types/request-context';
import type {
  AccepterPartageDto,
  AffichagePartageDto,
  DemanderPartageDto,
  InviterPartageDto,
  ModifierPartageDto,
} from './dto/partages.dto';
import { LIBELLE_NIVEAU, filtrerEtMasquer } from './masquage';

/**
 * LE PARTAGE D'AGENDA ENTRE COMPTES, COMME DANS OUTLOOK (24/09/2026).
 *
 * Remplace l'ancienne « équipe » à l'intérieur d'un compte : sur Les Extras,
 * un compte = une personne, et deux personnes qui travaillent ensemble se
 * relient par un partage, qu'elles choisissent, niveau par niveau.
 *
 * Trois règles tiennent ce fichier :
 *  1. C'est TOUJOURS la personne sollicitée qui décide. Une invitation ne
 *     montre rien tant que la personne invitée ne l'a pas acceptée ; une
 *     demande ne montre rien tant que la personne titulaire ne l'a pas
 *     acceptée, et c'est elle qui choisit alors le niveau.
 *  2. Chacun des deux peut retirer le partage, à tout moment, d'un clic.
 *  3. Rien n'est copié : le calendrier partagé lit l'agenda à chaque
 *     affichage, et `masquage.ts` est la seule porte de sortie.
 */
const ACTIFS = ['EN_ATTENTE', 'ACCEPTE'] as const;
const PALETTE = ['#2563eb', '#16a34a', '#d97706', '#9333ea', '#dc2626', '#0891b2', '#db2777', '#65a30d'];
const MAX_PARTAGES = 60;
const FENETRE_MAX_JOURS = 100;

const INCLURE = {
  compte: { select: { id: true, name: true, type: true, slug: true } },
  proprietaire: { select: { id: true, firstName: true, lastName: true, email: true } },
  destinataire: { select: { id: true, firstName: true, lastName: true, email: true } },
} satisfies Prisma.PartageAgendaInclude;
type PartageComplet = Prisma.PartageAgendaGetPayload<{ include: typeof INCLURE }>;

@Injectable()
export class PartagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agenda: AgendaService,
    private readonly mail: MailService,
    private readonly notifications: NotificationsService,
  ) {}

  /* ------------------------------------------------------------------ */
  /* Créer                                                               */
  /* ------------------------------------------------------------------ */

  /** J'invite quelqu'un à voir l'agenda de mon compte actif. */
  async inviter(user: RequestUser, account: RequestAccount, dto: InviterPartageDto) {
    if (account.role !== 'OWNER') throw new ForbiddenException('Seule la personne titulaire du compte peut partager son agenda.');
    const email = normaliser(dto.email);
    if (email === normaliser(user.email)) throw new BadRequestException('Vous voyez déjà votre propre agenda.');

    const nb = await this.prisma.partageAgenda.count({ where: { compteId: account.id, statut: { in: [...ACTIFS] } } });
    const existant = await this.prisma.partageAgenda.findFirst({
      where: { compteId: account.id, destinataireEmail: email, statut: { in: [...ACTIFS] } },
    });
    if (!existant && nb >= MAX_PARTAGES) throw new BadRequestException(`Un agenda se partage avec ${MAX_PARTAGES} personnes au plus.`);

    const invite = await this.prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } }, select: { id: true, email: true } });
    const donnees = {
      niveau: dto.niveau,
      inclutReservations: dto.inclutReservations ?? true,
      message: dto.message?.trim() || null,
    };
    const partage = existant
      ? await this.prisma.partageAgenda.update({ where: { id: existant.id }, data: donnees })
      : await this.prisma.partageAgenda.create({
          data: {
            ...donnees,
            sens: 'INVITATION',
            statut: 'EN_ATTENTE',
            compteId: account.id,
            proprietaireId: user.id,
            destinataireId: invite?.id ?? null,
            destinataireEmail: email,
            creeParId: user.id,
          },
        });

    if (!existant || existant.statut === 'EN_ATTENTE') {
      const [qui, compte] = await Promise.all([this.nomDe(user.id), this.nomDuCompte(account.id)]);
      if (invite) {
        await this.prevenir(invite.id, `${qui} partage son agenda avec vous`, `Niveau : ${LIBELLE_NIVEAU[dto.niveau]}.`);
      }
      await this.mail
        .sendPartageAgenda(email, { type: 'INVITATION', qui, compte, niveau: LIBELLE_NIVEAU[dto.niveau], message: donnees.message, inscrit: Boolean(invite) })
        .catch(() => undefined);
    }
    return this.presenter(await this.charger(partage.id), user);
  }

  /** Je demande à voir l'agenda d'une personne qui a un compte. */
  async demander(user: RequestUser, dto: DemanderPartageDto) {
    const email = normaliser(dto.email);
    if (email === normaliser(user.email)) throw new BadRequestException('Vous voyez déjà votre propre agenda.');
    const cible = await this.prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } }, select: { id: true, email: true } });
    if (!cible) {
      throw new NotFoundException(
        "Personne n'a de compte Les Extras avec cette adresse. Vous pouvez, à l'inverse, l'inviter à voir votre agenda.",
      );
    }
    const existant = await this.prisma.partageAgenda.findFirst({
      where: { proprietaireId: cible.id, destinataireId: user.id, statut: { in: [...ACTIFS] } },
    });
    if (existant?.statut === 'ACCEPTE') throw new ConflictException('Vous voyez déjà cet agenda.');

    const partage = existant
      ? await this.prisma.partageAgenda.update({ where: { id: existant.id }, data: { niveau: dto.niveau, message: dto.message?.trim() || null } })
      : await this.prisma.partageAgenda.create({
          data: {
            sens: 'DEMANDE',
            statut: 'EN_ATTENTE',
            niveau: dto.niveau,
            message: dto.message?.trim() || null,
            proprietaireId: cible.id,
            destinataireId: user.id,
            destinataireEmail: normaliser(user.email),
            creeParId: user.id,
          },
        });

    const qui = await this.nomDe(user.id);
    await this.prevenir(cible.id, `${qui} demande à voir votre agenda`, `Niveau demandé : ${LIBELLE_NIVEAU[dto.niveau]}.`);
    await this.mail
      .sendPartageAgenda(cible.email, { type: 'DEMANDE', qui, niveau: LIBELLE_NIVEAU[dto.niveau], message: dto.message?.trim() || null, inscrit: true })
      .catch(() => undefined);
    return this.presenter(await this.charger(partage.id), user);
  }

  /* ------------------------------------------------------------------ */
  /* Lire                                                                */
  /* ------------------------------------------------------------------ */

  async lister(user: RequestUser, account: RequestAccount) {
    const email = normaliser(user.email);
    const tous = await this.prisma.partageAgenda.findMany({
      where: {
        statut: { in: [...ACTIFS] },
        OR: [
          { proprietaireId: user.id },
          { destinataireId: user.id },
          { destinataireId: null, destinataireEmail: email },
        ],
      },
      include: INCLURE,
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
    const vues = tous.map((p) => this.presenter(p, user));
    return {
      compteActif: account.id,
      /** L'agenda de mes comptes, vu par d'autres (acceptés ou en attente de leur réponse). */
      accordes: vues.filter((p) => p.jeSuisTitulaire && (p.statut === 'ACCEPTE' || p.sens === 'INVITATION')),
      /** Les agendas que je vois. */
      recus: vues.filter((p) => p.jeSuisDestinataire && p.statut === 'ACCEPTE'),
      /** Ce qui attend MA réponse. */
      invitationsRecues: vues.filter((p) => p.jeSuisDestinataire && p.statut === 'EN_ATTENTE' && p.sens === 'INVITATION'),
      demandesRecues: vues.filter((p) => p.jeSuisTitulaire && p.statut === 'EN_ATTENTE' && p.sens === 'DEMANDE'),
      /** Ce que j'ai demandé, qui attend la réponse de l'autre. */
      demandesEnvoyees: vues.filter((p) => p.jeSuisDestinataire && p.statut === 'EN_ATTENTE' && p.sens === 'DEMANDE'),
    };
  }

  /** Les agendas que je vois, sur la fenêtre demandée, masqués selon le niveau. */
  async calendrier(user: RequestUser, du?: string, au?: string) {
    const debut = du ? new Date(du) : new Date();
    const fin = au ? new Date(au) : new Date(debut.getTime() + 31 * 86_400_000);
    if (Number.isNaN(debut.getTime()) || Number.isNaN(fin.getTime()) || fin < debut) {
      throw new BadRequestException('Période invalide.');
    }
    if (fin.getTime() - debut.getTime() > FENETRE_MAX_JOURS * 86_400_000) {
      throw new BadRequestException(`La période affichée ne dépasse pas ${FENETRE_MAX_JOURS} jours.`);
    }
    const partages = await this.prisma.partageAgenda.findMany({
      where: { statut: 'ACCEPTE', compteId: { not: null }, OR: [{ destinataireId: user.id }, { destinataireId: null, destinataireEmail: normaliser(user.email) }] },
      include: INCLURE,
      orderBy: { createdAt: 'asc' },
      take: MAX_PARTAGES,
    });
    return Promise.all(
      partages.map(async (p, i) => {
        const brut = await this.agenda.evenements(p.compteId as string, debut.toISOString(), fin.toISOString());
        const vue = this.presenter(p, user, i);
        return { ...vue, evenements: filtrerEtMasquer(brut, p.niveau, p.inclutReservations, `p:${p.id}`) };
      }),
    );
  }

  /** Les offres de services publiées du compte partagé. */
  async offres(user: RequestUser, id: string) {
    const p = await this.charger(id);
    if (p.statut !== 'ACCEPTE' || !this.estDestinataire(p, user) || !p.compteId) throw new NotFoundException('Ce partage n’existe pas.');
    const services = await this.prisma.service.findMany({
      where: { accountId: p.compteId, status: 'PUBLISHED' },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        category: true,
        format: true,
        duration: true,
        durationMinutes: true,
        price: true,
        city: true,
        images: true,
        timeSlots: true,
      },
    });
    return services.map((s) => ({
      ...s,
      description: s.description.length > 280 ? `${s.description.slice(0, 277)}…` : s.description,
      price: s.price === null ? null : Number(s.price),
      image: s.images[0] ?? null,
      images: undefined,
    }));
  }

  /* ------------------------------------------------------------------ */
  /* Répondre, régler, retirer                                           */
  /* ------------------------------------------------------------------ */

  async accepter(user: RequestUser, account: RequestAccount, id: string, dto: AccepterPartageDto) {
    const p = await this.charger(id);
    if (p.statut !== 'EN_ATTENTE') throw new ConflictException('Cette demande a déjà reçu une réponse.');
    let data: Prisma.PartageAgendaUpdateInput;
    let autre: string;
    if (p.sens === 'INVITATION') {
      if (!this.estDestinataire(p, user)) throw new NotFoundException('Ce partage n’existe pas.');
      data = { destinataire: { connect: { id: user.id } }, statut: 'ACCEPTE', reponduLe: new Date() };
      autre = p.proprietaireId as string;
    } else {
      if (p.proprietaireId !== user.id) throw new NotFoundException('Ce partage n’existe pas.');
      if (account.role !== 'OWNER') throw new ForbiddenException('Ouvrez un compte dont vous êtes titulaire pour partager son agenda.');
      data = {
        compte: { connect: { id: account.id } },
        niveau: dto.niveau ?? p.niveau,
        inclutReservations: dto.inclutReservations ?? p.inclutReservations,
        statut: 'ACCEPTE',
        reponduLe: new Date(),
      };
      autre = p.destinataireId as string;
    }
    await this.prisma.partageAgenda.update({ where: { id }, data });
    await this.repondre(autre, user, 'ACCEPTE');
    return this.presenter(await this.charger(id), user);
  }

  async refuser(user: RequestUser, id: string) {
    const p = await this.charger(id);
    if (p.statut !== 'EN_ATTENTE') throw new ConflictException('Cette demande a déjà reçu une réponse.');
    const sollicite = p.sens === 'INVITATION' ? this.estDestinataire(p, user) : p.proprietaireId === user.id;
    if (!sollicite) throw new NotFoundException('Ce partage n’existe pas.');
    await this.prisma.partageAgenda.update({ where: { id }, data: { statut: 'REFUSE', reponduLe: new Date() } });
    await this.repondre(p.creeParId, user, 'REFUSE');
    return { refuse: true };
  }

  /** La personne titulaire change le niveau ou retire les réservations. */
  async modifier(user: RequestUser, id: string, dto: ModifierPartageDto) {
    const p = await this.charger(id);
    if (p.proprietaireId !== user.id || !ACTIFS.includes(p.statut as (typeof ACTIFS)[number])) throw new NotFoundException('Ce partage n’existe pas.');
    await this.prisma.partageAgenda.update({
      where: { id },
      data: {
        ...(dto.niveau ? { niveau: dto.niveau } : {}),
        ...(dto.inclutReservations !== undefined ? { inclutReservations: dto.inclutReservations } : {}),
      },
    });
    return this.presenter(await this.charger(id), user);
  }

  /** La personne qui voit l'agenda règle sa couleur et son affichage. */
  async affichage(user: RequestUser, id: string, dto: AffichagePartageDto) {
    const p = await this.charger(id);
    if (!this.estDestinataire(p, user)) throw new NotFoundException('Ce partage n’existe pas.');
    await this.prisma.partageAgenda.update({
      where: { id },
      data: { ...(dto.couleur ? { couleur: dto.couleur } : {}), ...(dto.visible !== undefined ? { visible: dto.visible } : {}) },
    });
    return this.presenter(await this.charger(id), user);
  }

  /** L'un ou l'autre retire le partage. Rien n'est effacé : le statut suffit. */
  async retirer(user: RequestUser, id: string) {
    const p = await this.charger(id);
    if (p.proprietaireId !== user.id && !this.estDestinataire(p, user)) throw new NotFoundException('Ce partage n’existe pas.');
    await this.prisma.partageAgenda.update({ where: { id }, data: { statut: 'RETIRE', reponduLe: new Date() } });
    return { retire: true };
  }

  /* ------------------------------------------------------------------ */
  /* Écrire dans l'agenda partagé (niveau MODIFICATION)                  */
  /* ------------------------------------------------------------------ */

  async creerRendezVous(user: RequestUser, id: string, dto: CreerRendezVousDto) {
    const p = await this.partageModifiable(user, id);
    const rdv = await this.agenda.creer(p.compteId as string, user.id, dto);
    await this.signalerModification(p, user, `a ajouté « ${rdv.titre} » à votre agenda`);
    return rdv;
  }

  async modifierRendezVous(user: RequestUser, id: string, rdvId: string, dto: ModifierRendezVousDto) {
    const p = await this.partageModifiable(user, id);
    const rdv = await this.agenda.modifier(p.compteId as string, rdvId, dto);
    await this.signalerModification(p, user, `a modifié « ${rdv.titre} » dans votre agenda`);
    return rdv;
  }

  async supprimerRendezVous(user: RequestUser, id: string, rdvId: string) {
    const p = await this.partageModifiable(user, id);
    const r = await this.agenda.supprimer(p.compteId as string, rdvId);
    await this.signalerModification(p, user, 'a supprimé un rendez-vous de votre agenda');
    return r;
  }

  /* ------------------------------------------------------------------ */
  /* Outils                                                              */
  /* ------------------------------------------------------------------ */

  private async partageModifiable(user: RequestUser, id: string) {
    const p = await this.charger(id);
    if (p.statut !== 'ACCEPTE' || !this.estDestinataire(p, user) || !p.compteId) throw new NotFoundException('Ce partage n’existe pas.');
    if (p.niveau !== 'MODIFICATION') throw new ForbiddenException('Ce partage ne vous permet que de consulter cet agenda.');
    return p;
  }

  private async signalerModification(p: PartageAgenda, user: RequestUser, action: string) {
    if (!p.proprietaireId) return;
    const qui = await this.nomDe(user.id);
    await this.prevenir(p.proprietaireId, `${qui} ${action}`, 'Grâce au partage de votre agenda avec droit de modification.').catch(() => undefined);
  }

  private estDestinataire(p: PartageAgenda, user: RequestUser) {
    return p.destinataireId === user.id || (!p.destinataireId && p.destinataireEmail === normaliser(user.email));
  }

  private async charger(id: string): Promise<PartageComplet> {
    const p = await this.prisma.partageAgenda.findUnique({ where: { id }, include: INCLURE });
    if (!p) throw new NotFoundException('Ce partage n’existe pas.');
    return p;
  }

  private presenter(p: PartageComplet, user: RequestUser, rang = 0) {
    const jeSuisTitulaire = p.proprietaireId === user.id;
    const jeSuisDestinataire = this.estDestinataire(p, user);
    return {
      id: p.id,
      sens: p.sens,
      statut: p.statut,
      niveau: p.niveau,
      inclutReservations: p.inclutReservations,
      message: p.message,
      couleur: p.couleur ?? PALETTE[rang % PALETTE.length],
      visible: p.visible,
      jeSuisTitulaire,
      jeSuisDestinataire,
      compte: p.compte ? { id: p.compte.id, nom: p.compte.name, type: p.compte.type, slug: p.compte.slug } : null,
      titulaire: p.proprietaire ? { nom: nom(p.proprietaire), email: p.proprietaire.email } : null,
      destinataire: {
        nom: p.destinataire ? nom(p.destinataire) : null,
        email: p.destinataire?.email ?? p.destinataireEmail,
        inscrit: Boolean(p.destinataire),
      },
      creeLe: p.createdAt,
      reponduLe: p.reponduLe,
    };
  }

  private async repondre(userId: string | null, par: RequestUser, type: 'ACCEPTE' | 'REFUSE') {
    if (!userId) return;
    const [qui, dest] = await Promise.all([
      this.nomDe(par.id),
      this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
    ]);
    await this.prevenir(
      userId,
      type === 'ACCEPTE' ? `${qui} a accepté le partage d’agenda` : `${qui} a refusé le partage d’agenda`,
      type === 'ACCEPTE' ? 'L’agenda apparaît maintenant dans votre agenda.' : undefined,
    ).catch(() => undefined);
    if (dest) await this.mail.sendPartageAgenda(dest.email, { type, qui, inscrit: true }).catch(() => undefined);
  }

  private prevenir(userId: string, title: string, body?: string) {
    return this.notifications.create(userId, {
      type: 'PARTAGE_AGENDA',
      title,
      body,
      link: '/dashboard/agenda?onglet=partages',
    });
  }

  private async nomDe(userId: string) {
    const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true, email: true } });
    return (u && nom(u)) || u?.email || 'Une personne';
  }

  private async nomDuCompte(accountId: string) {
    const a = await this.prisma.account.findUnique({ where: { id: accountId }, select: { name: true } });
    return a?.name ?? null;
  }
}

function normaliser(email: string) {
  return email.trim().toLowerCase();
}

function nom(u: { firstName?: string | null; lastName?: string | null; email?: string | null }) {
  return [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || null;
}
