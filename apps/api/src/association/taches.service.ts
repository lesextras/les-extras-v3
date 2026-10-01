import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MembershipStatus, PrioriteTache, StatutTache, type Prisma, type TacheProjet } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EspaceService } from './espace.service';
import type { DeplacerTacheDto, FiltresTachesDto, ModifierTacheDto, TacheDto } from './dto/espace.dto';
import {
  ROLES_EQUIPE,
  cleResponsable,
  clesDeMoi,
  construireEquipe,
  estEnRetard,
  faiteLeSelon,
  lireResponsable,
  reordonner,
  trierAFaire,
  verifierDates,
} from './taches';

export interface Moi {
  id: string;
  email: string;
}

type TacheAvecProjet = TacheProjet & { action: { id: string; intitule: string } };

/**
 * LES TÂCHES DES PROJETS (« Mes projets »).
 *
 * Toujours bornées à l'organisation du compte : un identifiant de projet, de
 * tâche ou de responsable venu d'ailleurs est refusé comme introuvable.
 */
@Injectable()
export class TachesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly espace: EspaceService,
  ) {}

  /** Toutes les tâches de l'association, dans l'ordre du bloc « À faire » pour les ouvertes. */
  async taches(accountId: string, moi: Moi, filtres: FiltresTachesDto = {}) {
    const organisation = await this.espace.organisationDuCompte(accountId);
    const [contacts, acces] = await Promise.all([
      this.prisma.contactAssociation.findMany({
        where: { organisationId: organisation.id },
        select: { id: true, prenom: true, nom: true, email: true, roles: true },
      }),
      this.prisma.membership.findMany({
        where: { accountId, status: MembershipStatus.ACTIVE },
        select: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
      }),
    ]);
    const equipe = construireEquipe(
      contacts,
      acces.map((m) => ({ userId: m.user.id, email: m.user.email, firstName: m.user.firstName, lastName: m.user.lastName })),
      moi,
    );
    const miennes = clesDeMoi(contacts, moi);

    const where: Prisma.TacheProjetWhereInput = { organisationId: organisation.id };
    if (filtres.actionId) where.actionId = filtres.actionId;
    if (filtres.statut) where.statut = filtres.statut;
    if (filtres.ouvertes) where.statut = { not: StatutTache.FAITE };
    if (filtres.responsable) {
      const r = lireResponsable(filtres.responsable);
      if (r) Object.assign(where, r.type === 'contact' ? { responsableContactId: r.id } : { responsableUserId: r.id });
    }
    const brutes = await this.prisma.tacheProjet.findMany({
      where,
      include: { action: { select: { id: true, intitule: true } } },
      orderBy: [{ ordre: 'asc' }, { createdAt: 'asc' }],
    });
    const maintenant = new Date();
    let taches = brutes.map((t) => this.decorer(t, miennes, maintenant));
    if (filtres.miennes) taches = taches.filter((t) => t.aMoi);

    const ouvertes = trierAFaire(taches);
    const faites = taches
      .filter((t) => t.statut === StatutTache.FAITE)
      .sort((a, b) => (b.faiteLe?.getTime() ?? 0) - (a.faiteLe?.getTime() ?? 0));

    return {
      taches: [...ouvertes, ...faites],
      equipe,
      resume: {
        total: taches.length,
        ouvertes: ouvertes.length,
        enRetard: ouvertes.filter((t) => t.enRetard).length,
        miennes: ouvertes.filter((t) => t.aMoi).length,
      },
    };
  }

  async creerTache(accountId: string, dto: TacheDto) {
    const organisation = await this.espace.organisationDuCompte(accountId);
    await this.projetDe(organisation.id, dto.actionId);
    const statut = dto.statut ?? StatutTache.A_FAIRE;
    const debut = dto.debut ? new Date(dto.debut) : null;
    const echeance = dto.echeance ? new Date(dto.echeance) : null;
    verifierDates(debut, echeance);
    const responsable = await this.responsable(accountId, organisation.id, dto.responsable);
    const dernier = await this.prisma.tacheProjet.findFirst({
      where: { actionId: dto.actionId, statut },
      orderBy: { ordre: 'desc' },
      select: { ordre: true },
    });
    return this.prisma.tacheProjet.create({
      data: {
        organisationId: organisation.id,
        actionId: dto.actionId,
        titre: dto.titre.trim(),
        description: dto.description?.trim() || null,
        statut,
        priorite: dto.priorite ?? PrioriteTache.NORMALE,
        debut,
        echeance,
        ...responsable,
        ordre: dernier ? dernier.ordre + 1 : 0,
        faiteLe: faiteLeSelon(statut, null, new Date()),
      },
    });
  }

  async modifierTache(accountId: string, id: string, dto: ModifierTacheDto) {
    const organisation = await this.espace.organisationDuCompte(accountId);
    const existante = await this.tacheDe(organisation.id, id);
    if (dto.actionId && dto.actionId !== existante.actionId) await this.projetDe(organisation.id, dto.actionId);
    const date = (v: string | null | undefined) => (v === undefined ? undefined : v ? new Date(v) : null);
    const debut = date(dto.debut);
    const echeance = date(dto.echeance);
    verifierDates(debut === undefined ? existante.debut : debut, echeance === undefined ? existante.echeance : echeance);
    const responsable = dto.responsable === undefined ? {} : await this.responsable(accountId, organisation.id, dto.responsable);
    const statut = dto.statut ?? existante.statut;
    const changeDeColonne = statut !== existante.statut || (dto.actionId !== undefined && dto.actionId !== existante.actionId);
    let ordre: number | undefined;
    if (changeDeColonne) {
      const dernier = await this.prisma.tacheProjet.findFirst({
        where: { actionId: dto.actionId ?? existante.actionId, statut, id: { not: id } },
        orderBy: { ordre: 'desc' },
        select: { ordre: true },
      });
      ordre = dernier ? dernier.ordre + 1 : 0;
    }
    return this.prisma.tacheProjet.update({
      where: { id },
      data: {
        actionId: dto.actionId,
        titre: dto.titre?.trim(),
        description: dto.description === undefined ? undefined : dto.description?.trim() || null,
        statut: dto.statut,
        priorite: dto.priorite,
        debut,
        echeance,
        ...responsable,
        ordre,
        faiteLe: faiteLeSelon(statut, existante, new Date()),
      },
    });
  }

  async supprimerTache(accountId: string, id: string) {
    const organisation = await this.espace.organisationDuCompte(accountId);
    await this.tacheDe(organisation.id, id);
    await this.prisma.tacheProjet.delete({ where: { id } });
    return { ok: true };
  }

  /** Glisser-déposer : la tâche change de colonne et/ou de rang ; la colonne est renumérotée. */
  async deplacerTache(accountId: string, id: string, dto: DeplacerTacheDto) {
    const organisation = await this.espace.organisationDuCompte(accountId);
    const tache = await this.tacheDe(organisation.id, id);
    const colonne = await this.prisma.tacheProjet.findMany({
      where: { actionId: tache.actionId, statut: dto.statut },
      orderBy: [{ ordre: 'asc' }, { createdAt: 'asc' }],
      select: { id: true },
    });
    const ids = reordonner(
      colonne.map((t) => t.id),
      id,
      dto.position ?? Number.POSITIVE_INFINITY,
    );
    const faiteLe = faiteLeSelon(dto.statut, tache, new Date());
    await this.prisma.$transaction(
      ids.map((x, i) =>
        x === id
          ? this.prisma.tacheProjet.update({ where: { id: x }, data: { statut: dto.statut, ordre: i, faiteLe } })
          : this.prisma.tacheProjet.update({ where: { id: x }, data: { ordre: i } }),
      ),
    );
    return { ok: true, statut: dto.statut, ordre: ids.indexOf(id) };
  }

  // ------------------------------------------------------------------ outils

  private decorer(t: TacheAvecProjet, miennes: Set<string>, maintenant: Date) {
    const cle = cleResponsable(t);
    return {
      ...t,
      projet: t.action,
      responsable: cle ? { cle, nom: t.responsableNom ?? 'Sans nom' } : null,
      aMoi: cle !== null && miennes.has(cle),
      enRetard: estEnRetard(t, maintenant),
    };
  }

  private async projetDe(organisationId: string, actionId: string) {
    const projet = await this.prisma.actionAssociation.findFirst({ where: { id: actionId, organisationId }, select: { id: true } });
    if (!projet) throw new NotFoundException('Ce projet est introuvable.');
    return projet;
  }

  private async tacheDe(organisationId: string, id: string) {
    const tache = await this.prisma.tacheProjet.findFirst({ where: { id, organisationId } });
    if (!tache) throw new NotFoundException('Cette tâche est introuvable.');
    return tache;
  }

  /** Vérifie que le responsable est bien de la maison, et recopie son nom. */
  private async responsable(accountId: string, organisationId: string, cle: string | null | undefined) {
    const r = lireResponsable(cle);
    if (!r) return { responsableContactId: null, responsableUserId: null, responsableNom: null };
    if (r.type === 'contact') {
      const c = await this.prisma.contactAssociation.findFirst({
        where: { id: r.id, organisationId },
        select: { id: true, prenom: true, nom: true, roles: true },
      });
      if (!c) throw new BadRequestException("Cette personne n'est pas dans ton équipe.");
      if (!c.roles.some((x) => ROLES_EQUIPE.includes(x))) throw new BadRequestException("Cette personne n'est pas dans ton équipe.");
      return { responsableContactId: c.id, responsableUserId: null, responsableNom: `${c.prenom} ${c.nom}`.trim() };
    }
    const m = await this.prisma.membership.findFirst({
      where: { accountId, userId: r.id, status: MembershipStatus.ACTIVE },
      select: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });
    if (!m) throw new BadRequestException("Cette personne n'a pas accès à l'espace.");
    const nom = [m.user.firstName, m.user.lastName].filter(Boolean).join(' ').trim() || m.user.email;
    return { responsableContactId: null, responsableUserId: m.user.id, responsableNom: nom };
  }
}
