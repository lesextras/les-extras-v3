/**
 * LES SIX PUBLICS D'UNE FORMATION — vocabulaire FERMÉ.
 *
 * ⚠ CES SIX ÉTIQUETTES SONT CELLES DÉJÀ EN BASE. Elles viennent de
 * `apps/api/prisma/seed-mini-formations.js` (constante `PUBLICS`), qui a
 * étiqueté les douze parcours gratuits. Les recopier au mot près n'est pas du
 * zèle : le filtre du catalogue compare des CHAÎNES. « Protection de
 * l'enfance » avec une apostrophe droite au lieu d'une apostrophe typographique
 * fabrique une septième étiquette, qui ne remonte jamais avec les autres et
 * qu'on ne voit qu'en comptant les résultats.
 *
 * ⚠ CE N'EST PAS LE MÊME VOCABULAIRE QUE CELUI DES ATELIERS
 * (`PUBLICS` dans `ServiceModal.tsx` : Enfants, Adolescents, Adultes…), et
 * c'est assumé. Un atelier s'adresse aux PERSONNES ACCOMPAGNÉES ; une
 * formation s'adresse à CELUI QUI ACCOMPAGNE. « Enfants » sur une formation
 * voudrait dire qu'on forme des enfants. Les deux listes décrivent deux choses
 * différentes qui portent par hasard le même nom de champ.
 */
export const PUBLICS_FORMATION = [
  'Parents et proches',
  'Professionnels du médico-social',
  'Protection de l’enfance',
  'École, enseignants et AESH',
  'Assistants familiaux',
  'Encadrement et direction',
] as const;
