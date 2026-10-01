import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MembershipStatus, PrioriteTache, StatutTache, type Prisma, type TacheProjet } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EspaceService } from './espace.service';
import { filtreComptes, filtreProprietaire, type Perimetre } from '../liaisons/liaisons';
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

interface ProjetProprietaire {
  id: string;
  organisationId: string | null;
  academieId: string | null;
}

type TacheAvecProjet = TacheProjet & { action: { id: string; intitule: string } };

/** Un compte d'association (son identifiant), ou un périmètre déjà calculé (académie reliée). */
export type Cible = string | Perimetre;

/**
 * LES TÂCHES DES PROJETS (« Mes projets »).
 *
 * Toujours bornées au périmètre du compte : l'organisation d'une association,
 * ou, pour une académie, ses propres projets et ceux des associations reliées
 * par un lien ACTIVE. Un identifiant de projet, de tâche ou de responsable
 * venu d'ailleurs est refusé comme introuvable.
 */
@Injectable()
export class TachesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly espace: EspaceService,
  ) {}

  /** Le périmètre d'un compte d'association : son organisation, ses membres. */
  async perimetre(cible: Cible): Promise<Perimetre> {
    if (typeof cible !== 'string') return cible;
    const organisation = await this.espace.organisationDuCompte(cible);
    return { accountId: cible, organisationIds: [organisation.id], academieIds: [], comptes: [cible] };
  }

  /** Toutes les tâches du périmètre, dans l'ordre du bloc « À faire » pour les ouvertes. */
  async taches(cible: Cible, moi: Moi, filtres: FiltresTachesDto = {}) {
    const p = await this.perimetre(cible);
    const [contacts, acces] = await Promise.all([
      p.organisationIds.length
        ? this.prisma.contactAssociation.findMany({
            where: { organisationId: p.organisationIds.length === 1 ? p.organisationIds[0] : { in: p.organisationIds } },
            select: { id: true, prenom: true, nom: true, email: true, roles: true },
          })
        : Promise.resolve([]),
      this.prisma.membership.findMany({
        where: { accountId: filtreComptes(p), status: MembershipStatus.ACTIVE },
        select: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
      }),
    ]);
    const vus = new Set<string>();
    const equipe = construireEquipe(
      contacts,
      acces
        .filter((m) => (vus.has(m.user.id) ? false : (vus.add(m.user.id), true)))
        .map((m) => ({ userId: m.user.id, email: m.user.email, firstName: m.user.firstName, lastName: m.user.lastName })),
      moi,
    );
    const miennes = clesDeMoi(contacts, moi);

    const where: Prisma.TacheProjetWhereInput = { ...filtreProprietaire(p) };
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

  async creerTache(cible: Cible, dto: TacheDto) {
    const p = await this.perimetre(cible);
    const projet = await this.projetDe(p, dto.actionId);
    const statut = dto.statut ?? StatutTache.A_FAIRE;
    const debut = dto.debut ? new Date(dto.debut) : null;
    const echeance = dto.echeance ? new Date(dto.echeance) : null;
    verifierDates(debut, echeance);
    const responsable = await this.responsable(p, projet, dto.responsable);
    const dernier = await this.prisma.tacheProjet.findFirst({
      where: { actionId: dto.actionId, statut },
      orderBy: { ordre: 'desc' },
      select: { ordre: true },
    });
    return this.prisma.tacheProjet.create({
      data: {
        organisationId: projet.organisationId,
        academieId: projet.academieId,
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

  async modifierTache(cible: Cible, id: string, dto: ModifierTacheDto) {
    const p = await this.perimetre(cible);
    const existante = await this.tacheDe(p, id);
    let projet = { id: existante.actionId, organisationId: existante.organisationId, academieId: existante.academieId };
    if (dto.actionId && dto.actionId !== existante.actionId) {
      projet = await this.projetDe(p, dto.actionId);
      // Une tâche reste dans l'espace de son projet : pas de passage d'une association à une académie.
      if ((projet.organisationId ?? null) !== (existante.organisationId ?? null) || (projet.academieId ?? null) !== (existante.academieId ?? null)) {
        throw new BadRequestException("Cette tâche ne peut pas passer dans un projet d'un autre espace.");
      }
    }
    const date = (v: string | null | undefined) => (v === undefined ? undefined : v ? new Date(v) : null);
    const debut = date(dto.debut);
    const echeance = date(dto.echeance);
    verifierDates(debut === undefined ? existante.debut : debut, echeance === undefined ? existante.echeance : echeance);
    const responsable = dto.responsable === undefined ? {} : await this.responsable(p, projet, dto.responsable);
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

  async supprimerTache(cible: Cible, id: string) {
    const p = await this.perimetre(cible);
    await this.tacheDe(p, id);
    await this.prisma.tacheProjet.delete({ where: { id } });
    return { ok: true };
  }

  /** Glisser-déposer : la tâche change de colonne et/ou de rang ; la colonne est renumérotée. */
  async deplacerTache(cible: Cible, id: string, dto: DeplacerTacheDto) {
    const p = await this.perimetre(cible);
    const tache = await this.tacheDe(p, id);
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

  private async projetDe(p: Perimetre, actionId: string): Promise<ProjetProprietaire> {
    const projet = await this.prisma.actionAssociation.findFirst({
      where: { id: actionId, ...filtreProprietaire(p) },
      select: { id: true, organisationId: true, academieId: true },
    });
    if (!projet) throw new NotFoundException('Ce projet est introuvable.');
    return projet;
  }

  private async tacheDe(p: Perimetre, id: string) {
    const tache = await this.prisma.tacheProjet.findFirst({ where: { id, ...filtreProprietaire(p) } });
    if (!tache) throw new NotFoundException('Cette tâche est introuvable.');
    return tache;
  }

  /**
   * Vérifie que le responsable est bien de la maison, et recopie son nom :
   * une personne de l'équipe de l'association propriétaire du projet, ou une
   * personne qui a accès à l'un des comptes du périmètre.
   */
  private async responsable(p: Perimetre, projet: ProjetProprietaire, cle: string | null | undefined) {
    const r = lireResponsable(cle);
    if (!r) return { responsableContactId: null, responsableUserId: null, responsableNom: null };
    if (r.type === 'contact') {
      if (!projet.organisationId) throw new BadRequestException("Cette personne n'est pas dans ton équipe.");
      const c = await this.prisma.contactAssociation.findFirst({
        where: { id: r.id, organisationId: projet.organisationId },
        select: { id: true, prenom: true, nom: true, roles: true },
      });
      if (!c) throw new BadRequestException("Cette personne n'est pas dans ton équipe.");
      if (!c.roles.some((x) => ROLES_EQUIPE.includes(x))) throw new BadRequestException("Cette personne n'est pas dans ton équipe.");
      return { responsableContactId: c.id, responsableUserId: null, responsableNom: `${c.prenom} ${c.nom}`.trim() };
    }
    const m = await this.prisma.membership.findFirst({
      where: { accountId: filtreComptes(p), userId: r.id, status: MembershipStatus.ACTIVE },
      select: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });
    if (!m) throw new BadRequestException("Cette personne n'a pas accès à l'espace.");
    const nom = [m.user.firstName, m.user.lastName].filter(Boolean).join(' ').trim() || m.user.email;
    return { responsableContactId: null, responsableUserId: m.user.id, responsableNom: nom };
  }
}
