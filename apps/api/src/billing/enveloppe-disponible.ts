import type { PrismaClient, Prisma } from '@prisma/client';

/**
 * L'ENVELOPPE LEX QUI PEUT PAYER LA PROCHAINE GÉNÉRATION DE CETTE PERSONNE.
 *
 * Écrit une seule fois, parce que deux endroits posent la même question :
 * `MemberGuard` (a-t-on de quoi payer ?) et `CreditsService.avecCredit`
 * (qui paie ?). Deux définitions finiraient par diverger, et la garde
 * ouvrirait une porte que le débit refermerait aussitôt.
 *
 * Règles, dans l'ordre :
 *  - l'enveloppe est ACTIVE et appartient à cette personne ;
 *  - le payeur n'est pas le compte actif (payer sa propre génération avec sa
 *    propre enveloppe n'a pas de sens : c'est déjà son solde) ;
 *  - le payeur a encore au moins un crédit ;
 *  - la personne n'a pas atteint son plafond du mois.
 *
 * Plusieurs enveloppes possibles (deux établissements) : la plus ancienne
 * passe d'abord, pour que l'ordre soit prévisible.
 */

type Lecteur = PrismaClient | Prisma.TransactionClient;

export function debutDuMoisUtc(maintenant = new Date()): Date {
  const d = new Date(maintenant);
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Générations consommées ce mois sur une enveloppe (remboursements déduits). */
export async function consommeCeMois(prisma: Lecteur, enveloppeId: string): Promise<number> {
  const somme = await prisma.creditLedger.aggregate({
    where: { enveloppeId, createdAt: { gte: debutDuMoisUtc() } },
    _sum: { delta: true },
  });
  return Math.max(0, -(somme._sum.delta ?? 0));
}

export async function enveloppeDisponible(
  prisma: Lecteur,
  userId: string,
  compteActifId: string,
): Promise<{ id: string; payeurAccountId: string } | null> {
  const enveloppes = await prisma.enveloppeLex.findMany({
    where: {
      beneficiaireId: userId,
      statut: 'ACTIVE',
      payeurAccountId: { not: compteActifId },
      payeur: { credits: { gt: 0 } },
    },
    orderBy: { accepteLe: 'asc' },
    select: { id: true, payeurAccountId: true, plafondMensuel: true },
  });
  for (const e of enveloppes) {
    if ((await consommeCeMois(prisma, e.id)) < e.plafondMensuel) {
      return { id: e.id, payeurAccountId: e.payeurAccountId };
    }
  }
  return null;
}
