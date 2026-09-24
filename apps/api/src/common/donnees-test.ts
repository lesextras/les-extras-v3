import { BadRequestException } from '@nestjs/common';

/**
 * LES DONNÉES DE TEST NE SORTENT PAS, ET NE COMPTENT PAS (24/09/2026).
 *
 * Les recettes laissent en base des fiches, des missions et des demandes
 * nommées « Essai technique visioconsultation (ne pas publier) » ou
 * « TEST QA ADÉPA 20260921 — NE PAS TRAITER ». Rien n'empêchait côté serveur de
 * les publier, et elles gonflaient les indicateurs de l'administration.
 *
 * La marque est le TITRE : c'est ce que tout le monde écrit déjà quand il crée
 * une donnée d'essai. Deux effets, tous deux côté serveur :
 *  1. une fiche ou une mission marquée ne peut pas passer « publiée » ;
 *  2. les compteurs de l'administration l'excluent (voir `SANS_TEST`).
 *
 * ⚠ La liste est volontairement étroite : un vrai atelier qui s'appellerait
 * « Tester ses limites » ne doit pas être bloqué. On ne reconnaît que des
 * mentions explicites.
 */
export const MARQUES_TEST = [
  'ne pas publier',
  'ne pas traiter',
  'test qa',
  '[test]',
  'essai technique',
  'donnée de test',
  'donnees de test',
  'données de test',
] as const;

export function estMarqueTest(texte: string | null | undefined): boolean {
  if (!texte) return false;
  const bas = texte.toLowerCase();
  return MARQUES_TEST.some((m) => bas.includes(m));
}

/** Refuse la mise en ligne d'une donnée marquée comme test. */
export function refuserPublicationTest(titre: string | null | undefined): void {
  if (estMarqueTest(titre)) {
    throw new BadRequestException(
      'Ce titre marque une donnée de test (« ne pas publier », « test QA »…) : elle ne peut pas être mise en ligne. Renommez-la si elle est réelle.',
    );
  }
}

/** Filtre Prisma : exclut les lignes dont le titre porte une marque de test. */
export function sansTitreTest(champ = 'title') {
  return { NOT: MARQUES_TEST.map((m) => ({ [champ]: { contains: m, mode: 'insensitive' as const } })) };
}
