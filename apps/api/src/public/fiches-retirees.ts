import type { Prisma } from '@prisma/client';

/**
 * LES FICHES RETIRÉES DU CATALOGUE PUBLIC — une liste, un seul fichier.
 *
 * Décision de Siham (audit du 28/09/2026). Ces quatre fiches sont rangées dans
 * le catalogue des ATELIERS alors que ce sont des FORMATIONS. Or les
 * formations ont quitté Les Extras pour adepa77.fr, le site du centre de
 * formation ADéPA : les laisser ici, c'est vendre deux fois la même chose, sur
 * deux sites, à deux prix possibles.
 *
 * ⚠ ELLES NE SONT NI SUPPRIMÉES NI MODIFIÉES EN BASE. Siham les archive à la
 * main depuis l'administration ; cette liste fait tenir la décision MÊME SANS
 * cet archivage : elle est appliquée à toute LECTURE PUBLIQUE, par la constante
 * `VITRINE` de `public.service.ts` (catalogue, mises en avant de l'accueil,
 * fiche détaillée, demande de devis, fiches liées, vitrine d'un intervenant),
 * et le sitemap du site lit le catalogue public : elles en sortent du même
 * coup. L'espace connecté et l'administration les voient toujours.
 *
 * ⚠ LA CLÉ EST LE SLUG, PAS L'IDENTIFIANT : c'est l'adresse publique, celle que
 * `next.config.mjs` redirige en 308 vers adepa77.fr. Les deux listes doivent
 * rester d'accord ; ajouter une fiche ici, c'est aussi lui donner sa
 * redirection là-bas.
 */
export const FICHES_RETIREES_DU_CATALOGUE = [
  'accompagnement-des-jeunes-majeurs',
  'accueil-du-public-difficile-et-ou-en-difficulte-sociale',
  'gestion-de-la-violence-anticiper-et-gerer-les-conflits',
  'analyse-des-pratiques-professionnelles',
] as const;

/**
 * Le filtre Prisma correspondant.
 *
 * ⚠ LE `slug: null` EST INDISPENSABLE. En SQL, `slug NOT IN (…)` vaut NULL —
 * donc « faux » — sur une fiche sans slug : les fiches d'avant la bascule des
 * adresses lisibles disparaîtraient du catalogue en silence. On garde donc
 * explicitement les fiches sans slug, qui ne peuvent pas figurer dans la liste.
 */
export const HORS_FICHES_RETIREES = {
  OR: [{ slug: null }, { slug: { notIn: [...FICHES_RETIREES_DU_CATALOGUE] } }],
} satisfies Prisma.ServiceWhereInput;
