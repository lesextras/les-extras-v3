import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AccountRole, AccountType, StatutLiaison } from '@prisma/client';

/**
 * ESPACES INTERCONNECTÉS : les règles, sans base de données.
 *
 * Une association et une académie se relient par une LiaisonEspace. Reliées,
 * elles lisent et écrivent les MÊMES lignes (projets, tâches, liens aux
 * formations) : il n'y a jamais de copie, donc jamais rien à resynchroniser.
 *
 * Règles :
 *  - seul un propriétaire ou administrateur d'un espace engage cet espace
 *    (demander, accepter, refuser, retirer) ;
 *  - un lien ne devient ACTIVE que si l'AUTRE espace accepte, sauf quand la
 *    personne qui demande administre les deux : il est actif d'emblée ;
 *  - demander un lien que l'autre espace a déjà demandé vaut acceptation ;
 *  - tant qu'un lien n'est pas ACTIVE, il n'ouvre AUCUNE donnée.
 */

export const TYPES_RELIABLES: ReadonlySet<AccountType> = new Set([AccountType.ASSOCIATION, AccountType.ACADEMIE]);

export function estAdmin(role: AccountRole | null | undefined): boolean {
  return role === AccountRole.OWNER || role === AccountRole.ADMIN;
}

/** Le type d'espace avec lequel on peut se relier : une association avec une académie, et inversement. */
export function typeOppose(type: AccountType): AccountType {
  if (type === AccountType.ASSOCIATION) return AccountType.ACADEMIE;
  if (type === AccountType.ACADEMIE) return AccountType.ASSOCIATION;
  throw new BadRequestException('Seuls une association et une académie peuvent être reliées.');
}

export interface LiaisonExistante {
  statut: StatutLiaison;
  demandeDepuisAccountId: string;
}

/**
 * Ce que devient un lien quand quelqu'un le demande depuis `ici`.
 * @param adminIci   la personne administre l'espace d'où elle demande
 * @param adminLaBas la personne administre aussi l'autre espace
 * @returns le statut à enregistrer, ou `null` si rien ne change (déjà actif / déjà demandé)
 */
export function statutALaDemande(
  ici: string,
  adminIci: boolean,
  adminLaBas: boolean,
  existante: LiaisonExistante | null,
): StatutLiaison | null {
  if (!adminIci) throw new ForbiddenException('Seul un administrateur de cet espace peut le relier à un autre.');
  if (existante?.statut === StatutLiaison.ACTIVE) return null;
  if (adminLaBas) return StatutLiaison.ACTIVE;
  // L'autre espace avait déjà demandé : demander à son tour, c'est accepter.
  if (existante?.statut === StatutLiaison.EN_ATTENTE && existante.demandeDepuisAccountId !== ici) return StatutLiaison.ACTIVE;
  if (existante?.statut === StatutLiaison.EN_ATTENTE) return null;
  return StatutLiaison.EN_ATTENTE;
}

/** Accepter ou refuser : réservé à un administrateur de l'espace qui a REÇU la demande. */
export function verifierReponse(liaison: LiaisonExistante, ici: string, role: AccountRole | null | undefined) {
  if (liaison.statut !== StatutLiaison.EN_ATTENTE) throw new BadRequestException("Cette demande n'attend plus de réponse.");
  if (liaison.demandeDepuisAccountId === ici) throw new ForbiddenException("C'est l'autre espace qui doit répondre à ta demande.");
  if (!estAdmin(role)) throw new ForbiddenException('Seul un administrateur de cet espace peut répondre.');
}

/** Retirer un lien : un administrateur de l'un ou l'autre espace. */
export function verifierRetrait(role: AccountRole | null | undefined) {
  if (!estAdmin(role)) throw new ForbiddenException('Seul un administrateur de cet espace peut retirer un lien.');
}

/** Ce que le compte courant doit faire d'un lien, pour l'écran Réglages. */
export function sensDuLien(liaison: LiaisonExistante, ici: string): 'ACTIF' | 'A_REPONDRE' | 'ENVOYEE' | 'REFUSEE' {
  if (liaison.statut === StatutLiaison.ACTIVE) return 'ACTIF';
  if (liaison.statut === StatutLiaison.REFUSEE) return 'REFUSEE';
  return liaison.demandeDepuisAccountId === ici ? 'ENVOYEE' : 'A_REPONDRE';
}

/* ------------------------------------------------------- le périmètre */

/**
 * Ce qu'un compte voit dans « Mes projets » : les projets de ces associations
 * et de ces académies, et les comptes dont les membres peuvent porter une
 * tâche. Une association ne voit que les siens ; une académie voit les siens
 * ET ceux des associations reliées par un lien ACTIVE.
 */
export interface Perimetre {
  accountId: string;
  organisationIds: string[];
  academieIds: string[];
  /** Comptes dont les membres actifs peuvent être responsables d'une tâche. */
  comptes: string[];
}

const egalOuDans = (ids: string[]) => (ids.length === 1 ? ids[0] : { in: ids });

/** Le filtre Prisma « appartient au périmètre », pour un projet comme pour une tâche. */
export function filtreProprietaire(p: Perimetre): {
  organisationId?: string | { in: string[] };
  academieId?: string | { in: string[] };
  OR?: ({ organisationId: { in: string[] } } | { academieId: { in: string[] } })[];
} {
  if (!p.academieIds.length) return { organisationId: egalOuDans(p.organisationIds) };
  if (!p.organisationIds.length) return { academieId: egalOuDans(p.academieIds) };
  return { OR: [{ organisationId: { in: p.organisationIds } }, { academieId: { in: p.academieIds } }] };
}

export function filtreComptes(p: Perimetre): string | { in: string[] } {
  return egalOuDans([...new Set(p.comptes)]);
}

/** Le propriétaire demandé à la création : `academie` ou `association:<organisationId>`. */
export function lireProprietaire(
  cle: string | null | undefined,
  p: Perimetre,
): { organisationId: string; academieId: null } | { organisationId: null; academieId: string } {
  const valeur = (cle ?? '').trim();
  if (!valeur) {
    // Par défaut : le projet appartient à l'association reliée (s'il n'y en a qu'une), sinon à l'académie.
    if (p.organisationIds.length === 1) return { organisationId: p.organisationIds[0], academieId: null };
    if (p.academieIds.length === 1) return { organisationId: null, academieId: p.academieIds[0] };
    throw new BadRequestException('Choisis à quel espace appartient ce projet.');
  }
  if (valeur === 'academie' && p.academieIds.length === 1) return { organisationId: null, academieId: p.academieIds[0] };
  const m = /^association:([A-Za-z0-9_-]{1,40})$/.exec(valeur);
  if (m && p.organisationIds.includes(m[1])) return { organisationId: m[1], academieId: null };
  throw new BadRequestException("Ce projet ne peut pas appartenir à cet espace.");
}
