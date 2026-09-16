import { Capacite, NiveauResponsabilite, PorteeService, Prisma } from '@prisma/client';

/**
 * LE PÉRIMÈTRE — qui voit qui, et qui peut quoi.
 *
 * Tout le modèle tient en une phrase, et elle est écrite ici une seule fois
 * pour que personne n'en écrive une variante ailleurs :
 *
 *     je vois les gens que j'ai fait venir      →  aucune validation
 *     je vois des gens que je n'ai pas fait venir  →  validation
 *
 * Un chef de service qui arrive seul n'attend donc personne. Il crée ses
 * services, il invite son équipe, il ne voit qu'elle. Et c'est justement ce qui
 * rend l'absence de validation sans risque : quelqu'un qui se déclarerait
 * responsable sans l'être ne pourrait constituer un périmètre qu'avec des gens
 * ayant accepté son invitation — il ne prend rien, il reçoit.
 *
 * Seul le niveau DIRECTION échappe à la règle, parce qu'il donne la vue sur des
 * équipes constituées par d'autres, avant lui. C'est le seul qui passe par une
 * validation (Les Extras, ou une Direction déjà en place), et c'est
 * `niveauValide` qui l'atteste.
 *
 * ⚠ UN NIVEAU DÉCLARÉ NE PRODUIT RIEN. Tant que `niveauValide` est faux, une
 * Direction voit exactement ce que voit un salarié : elle-même. Ne jamais
 * tester `niveau === DIRECTION` sans tester `niveauValide` — c'est l'unique
 * garde-fou du modèle ouvert.
 */

/** Ce qu'il faut savoir d'un rattachement pour trancher ses droits. */
export interface MembreCourant {
  id: string;
  accountId: string;
  userId: string;
  niveau: NiveauResponsabilite;
  niveauValide: boolean;
  capacites: Capacite[];
  /** Les services que ce membre ENCADRE (portée ENCADREMENT). */
  servicesEncadres: string[];
  /** Les services où ce membre TRAVAILLE (portée RATTACHEMENT). */
  servicesRattaches: string[];
}

/** Sélection Prisma minimale pour construire un `MembreCourant`. */
export const SELECT_MEMBRE = {
  id: true,
  accountId: true,
  userId: true,
  niveau: true,
  niveauValide: true,
  capacites: true,
  services: { select: { orgUnitId: true, portee: true } },
} satisfies Prisma.MembershipSelect;

type MembreBrut = Prisma.MembershipGetPayload<{ select: typeof SELECT_MEMBRE }>;

export function versMembreCourant(m: MembreBrut): MembreCourant {
  return {
    id: m.id,
    accountId: m.accountId,
    userId: m.userId,
    niveau: m.niveau,
    niveauValide: m.niveauValide,
    capacites: m.capacites,
    servicesEncadres: m.services
      .filter((s) => s.portee === PorteeService.ENCADREMENT)
      .map((s) => s.orgUnitId),
    servicesRattaches: m.services
      .filter((s) => s.portee === PorteeService.RATTACHEMENT)
      .map((s) => s.orgUnitId),
  };
}

/** Direction VALIDÉE : la seule qui voit au-delà de ce qu'elle a constitué. */
export function estDirection(m: MembreCourant): boolean {
  return m.niveau === NiveauResponsabilite.DIRECTION && m.niveauValide;
}

/** Responsable : autonome sur les services qu'il encadre, sans validation. */
export function estResponsable(m: MembreCourant): boolean {
  return m.niveau === NiveauResponsabilite.RESPONSABLE || estDirection(m);
}

/**
 * LE FILTRE DE VISIBILITÉ SUR LES MEMBRES D'UN ÉTABLISSEMENT.
 *
 * Écrit une fois, appliqué partout : équipe, organigramme, plannings, demandes.
 * Une deuxième écriture de cette règle ailleurs finirait par diverger, et une
 * divergence ici ouvre les données d'une équipe à quelqu'un qui n'y a pas droit.
 */
export function filtreMembresVisibles(m: MembreCourant): Prisma.MembershipWhereInput {
  // Direction validée : tout l'établissement.
  if (estDirection(m)) {
    return { accountId: m.accountId };
  }

  // Responsable : les personnes rattachées aux services qu'il encadre, celles
  // qu'il a fait venir lui-même, et lui.
  if (m.niveau === NiveauResponsabilite.RESPONSABLE) {
    const ou: Prisma.MembershipWhereInput[] = [
      { id: m.id },
      { parrainMembershipId: m.id },
    ];
    if (m.servicesEncadres.length > 0) {
      ou.push({ services: { some: { orgUnitId: { in: m.servicesEncadres } } } });
      ou.push({ orgUnitId: { in: m.servicesEncadres } });
    }
    return { accountId: m.accountId, OR: ou };
  }

  // Salarié : lui-même, et les personnes qu'il aurait fait venir (un salarié
  // peut recevoir la capacité d'inviter sans être responsable).
  return {
    accountId: m.accountId,
    OR: [{ id: m.id }, { parrainMembershipId: m.id }],
  };
}

/** Les services sur lesquels ce membre a la main (création, invitation). */
export function servicesPilotes(m: MembreCourant): 'TOUS' | string[] {
  if (estDirection(m)) return 'TOUS';
  return m.servicesEncadres;
}

export function peutPiloterService(m: MembreCourant, orgUnitId: string): boolean {
  const p = servicesPilotes(m);
  return p === 'TOUS' || p.includes(orgUnitId);
}

/**
 * LES CAPACITÉS EFFECTIVES.
 *
 * Une Direction validée les a toutes d'office. Un responsable a d'office celles
 * qui pilotent ses propres services. Un salarié n'a que le socle, plus ce que
 * sa hiérarchie lui a accordé à l'unité.
 */
const SOCLE: Capacite[] = [Capacite.DEMANDER_DEVIS];

const SOCLE_RESPONSABLE: Capacite[] = [
  Capacite.DEMANDER_DEVIS,
  Capacite.DEMANDER_RENFORT_INTERNE,
  Capacite.GERER_PLANNING,
  Capacite.VALIDER_INSCRIPTIONS,
  Capacite.INVITER_MEMBRES,
];

export function capacitesEffectives(m: MembreCourant): Capacite[] {
  if (estDirection(m)) return Object.values(Capacite);
  const base =
    m.niveau === NiveauResponsabilite.RESPONSABLE ? SOCLE_RESPONSABLE : SOCLE;
  return Array.from(new Set([...base, ...m.capacites]));
}

export function a(m: MembreCourant, capacite: Capacite): boolean {
  return capacitesEffectives(m).includes(capacite);
}

/**
 * ON NE DÉLÈGUE QUE CE QUE L'ON DÉTIENT.
 *
 * Filtre les capacités demandées à celles que l'invitant possède réellement.
 * La délégation se propage de proche en proche — un coordinateur peut inviter
 * dans le service qu'on lui a confié — mais elle ne peut jamais en sortir.
 */
export function capacitesDelegables(invitant: MembreCourant, demandees: Capacite[]): Capacite[] {
  const miennes = capacitesEffectives(invitant);
  return demandees.filter((c) => miennes.includes(c));
}

/**
 * ON N'INVITE JAMAIS PLUS HAUT QUE SOI.
 *
 * Une Direction peut promouvoir une autre Direction — c'est ce qui règle le
 * départ du directeur et le cas du directeur adjoint. Un responsable peut
 * inviter un responsable (le coordinateur à qui il confie un service) ou un
 * salarié. Un salarié n'invite qu'un salarié.
 */
export function niveauDelegable(
  invitant: MembreCourant,
  demande: NiveauResponsabilite,
): NiveauResponsabilite {
  if (estDirection(invitant)) return demande;
  if (invitant.niveau === NiveauResponsabilite.RESPONSABLE) {
    return demande === NiveauResponsabilite.DIRECTION
      ? NiveauResponsabilite.RESPONSABLE
      : demande;
  }
  return NiveauResponsabilite.SALARIE;
}

/**
 * LE NIVEAU INVITÉ EST-IL VALIDÉ D'OFFICE ?
 *
 * Oui pour tout ce qui n'est pas DIRECTION : le périmètre d'un invité est
 * inclus dans celui de son invitant, donc il n'ouvre rien de nouveau. Non pour
 * DIRECTION, sauf si l'invitant est lui-même une Direction validée — seul cas
 * où quelqu'un qui a déjà la vue complète la transmet.
 */
export function niveauValideDOffice(
  invitant: MembreCourant,
  niveau: NiveauResponsabilite,
): boolean {
  if (niveau !== NiveauResponsabilite.DIRECTION) return true;
  return estDirection(invitant);
}
