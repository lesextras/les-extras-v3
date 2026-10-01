import { BadRequestException } from '@nestjs/common';
import { PrioriteTache, RoleContact, StatutTache } from '@prisma/client';

/**
 * LES TÂCHES DES PROJETS : les règles, sans base de données.
 *
 * Le responsable d'une tâche est désigné par une seule clé :
 *  - `contact:<id>` : une personne de « Mon équipe » (le répertoire) ;
 *  - `user:<id>`    : une personne qui a un accès au compte (droits d'accès).
 * La même personne peut être les deux : on la montre une seule fois, sous sa
 * fiche du répertoire, reconnue par son adresse e-mail.
 */

export const STATUTS_TACHE: StatutTache[] = [StatutTache.A_FAIRE, StatutTache.EN_COURS, StatutTache.BLOQUEE, StatutTache.FAITE];

/** Les rôles qui font de quelqu'un un membre de l'équipe (même règle que l'onglet « L'équipe » du répertoire). */
export const ROLES_EQUIPE: RoleContact[] = [
  RoleContact.PRESIDENT,
  RoleContact.TRESORIER,
  RoleContact.SECRETAIRE,
  RoleContact.MEMBRE_BUREAU,
  RoleContact.BENEVOLE,
  RoleContact.SALARIE,
];

export type Responsable = { type: 'contact' | 'user'; id: string };

/** Lit une clé de responsable. `null` ou chaîne vide = personne. */
export function lireResponsable(cle: string | null | undefined): Responsable | null {
  if (cle === null || cle === undefined || cle.trim() === '') return null;
  const m = /^(contact|user):([A-Za-z0-9_-]{1,40})$/.exec(cle.trim());
  if (!m) throw new BadRequestException('Ce responsable est inconnu.');
  return { type: m[1] as 'contact' | 'user', id: m[2] };
}

export function cleResponsable(t: { responsableContactId: string | null; responsableUserId: string | null }): string | null {
  if (t.responsableContactId) return `contact:${t.responsableContactId}`;
  if (t.responsableUserId) return `user:${t.responsableUserId}`;
  return null;
}

export function initiales(nom: string): string {
  const mots = nom.trim().split(/\s+/).filter(Boolean);
  if (mots.length === 0) return '?';
  const lettres = mots.length === 1 ? mots[0].slice(0, 2) : `${mots[0][0]}${mots[mots.length - 1][0]}`;
  return lettres.toUpperCase();
}

export interface MembreEquipe {
  cle: string;
  nom: string;
  initiales: string;
  /** EQUIPE : fiche du répertoire. ACCES : personne qui a un compte sur l'espace. */
  source: 'EQUIPE' | 'ACCES';
  moi: boolean;
}

interface ContactEquipe {
  id: string;
  prenom: string;
  nom: string;
  email: string | null;
  roles: RoleContact[];
}

interface MembreAcces {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

const normaliser = (e: string | null | undefined) => (e ?? '').trim().toLowerCase();

/**
 * L'équipe à qui on peut attribuer une tâche : les personnes de « Mon équipe »
 * (bureau, bénévoles, salariés), puis celles qui ont un accès au compte sans
 * fiche dans le répertoire.
 */
export function construireEquipe(contacts: ContactEquipe[], acces: MembreAcces[], moi: { id: string; email: string }): MembreEquipe[] {
  const emailMoi = normaliser(moi.email);
  const equipe = contacts.filter((c) => c.roles.some((r) => ROLES_EQUIPE.includes(r)));
  const emailsEquipe = new Set(equipe.map((c) => normaliser(c.email)).filter(Boolean));
  const liste: MembreEquipe[] = equipe.map((c) => {
    const nom = `${c.prenom} ${c.nom}`.trim();
    return { cle: `contact:${c.id}`, nom, initiales: initiales(nom), source: 'EQUIPE', moi: Boolean(emailMoi) && normaliser(c.email) === emailMoi };
  });
  for (const a of acces) {
    if (emailsEquipe.has(normaliser(a.email))) continue;
    const nom = [a.firstName, a.lastName].filter(Boolean).join(' ').trim() || a.email;
    liste.push({ cle: `user:${a.userId}`, nom, initiales: initiales(nom), source: 'ACCES', moi: a.userId === moi.id });
  }
  return liste.sort((x, y) => Number(y.moi) - Number(x.moi) || x.nom.localeCompare(y.nom, 'fr'));
}

/** Les clés qui désignent la personne connectée (son compte, et sa fiche d'équipe si son e-mail y figure). */
export function clesDeMoi(contacts: { id: string; email: string | null }[], moi: { id: string; email: string }): Set<string> {
  const emailMoi = normaliser(moi.email);
  const cles = new Set<string>([`user:${moi.id}`]);
  if (emailMoi) for (const c of contacts) if (normaliser(c.email) === emailMoi) cles.add(`contact:${c.id}`);
  return cles;
}

const POIDS_PRIORITE: Record<PrioriteTache, number> = { HAUTE: 0, NORMALE: 1, BASSE: 2 };

interface TacheTriable {
  statut: StatutTache;
  echeance: Date | null;
  priorite: PrioriteTache;
  ordre: number;
  createdAt: Date;
}

/**
 * L'ordre du bloc « À faire » : l'échéance la plus proche (ou dépassée)
 * d'abord, les tâches sans date à la fin ; à égalité, la plus urgente.
 */
export function comparerAFaire(a: TacheTriable, b: TacheTriable): number {
  const ea = a.echeance ? a.echeance.getTime() : Number.POSITIVE_INFINITY;
  const eb = b.echeance ? b.echeance.getTime() : Number.POSITIVE_INFINITY;
  if (ea !== eb) return ea < eb ? -1 : 1;
  return POIDS_PRIORITE[a.priorite] - POIDS_PRIORITE[b.priorite] || a.ordre - b.ordre || a.createdAt.getTime() - b.createdAt.getTime();
}

export function trierAFaire<T extends TacheTriable>(taches: T[]): T[] {
  return taches.filter((t) => t.statut !== StatutTache.FAITE).sort(comparerAFaire);
}

/** Une échéance passée la veille ou avant. Le jour même n'est pas en retard. */
export function estEnRetard(t: { statut: StatutTache; echeance: Date | null }, maintenant: Date): boolean {
  if (t.statut === StatutTache.FAITE || !t.echeance) return false;
  const jour = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return jour(t.echeance) < jour(maintenant);
}

/** La date « faite le » suit le statut : posée en passant à FAITE, effacée en repartant. */
export function faiteLeSelon(nouveau: StatutTache, ancien: { statut: StatutTache; faiteLe: Date | null } | null, maintenant: Date): Date | null {
  if (nouveau !== StatutTache.FAITE) return null;
  if (ancien && ancien.statut === StatutTache.FAITE && ancien.faiteLe) return ancien.faiteLe;
  return maintenant;
}

/** Combien de tâches par projet, et combien de faites. */
export function progressionParProjet(groupes: { actionId: string; statut: StatutTache; _count: { _all: number } }[]) {
  const parProjet = new Map<string, { tachesTotal: number; tachesFaites: number }>();
  for (const g of groupes) {
    const p = parProjet.get(g.actionId) ?? { tachesTotal: 0, tachesFaites: 0 };
    p.tachesTotal += g._count._all;
    if (g.statut === StatutTache.FAITE) p.tachesFaites += g._count._all;
    parProjet.set(g.actionId, p);
  }
  return parProjet;
}

/** Place `id` à la position voulue dans une colonne (déjà triée), en l'y ajoutant s'il venait d'ailleurs. */
export function reordonner(ids: string[], id: string, position: number): string[] {
  const reste = ids.filter((x) => x !== id);
  const p = Math.max(0, Math.min(Number.isFinite(position) ? Math.floor(position) : reste.length, reste.length));
  return [...reste.slice(0, p), id, ...reste.slice(p)];
}

/** Une échéance avant le début ne veut rien dire. */
export function verifierDates(debut: Date | null, echeance: Date | null) {
  if (debut && echeance && echeance.getTime() < debut.getTime()) {
    throw new BadRequestException("L'échéance doit venir après le début.");
  }
}
