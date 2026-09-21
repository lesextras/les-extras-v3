/**
 * CHERCHER SANS SE SOUCIER DES ACCENTS.
 *
 * ⚠⚠ LE DÉFAUT QUE CE FICHIER RÉPARE, MESURÉ EN PRODUCTION LE 21/09/2026 :
 * taper « adepa » dans la recherche d'établissement de l'inscription rendait
 * ZÉRO résultat, alors que trois établissements ADéPA y sont déclarés.
 *
 * La cause est dans PostgreSQL : le `contains` de Prisma devient un ILIKE, et
 * ILIKE est insensible à la CASSE, jamais aux ACCENTS. « ADéPA » ne contient
 * donc pas « adepa ». Le défaut touche tout ce qui s'écrit avec un accent en
 * français — Hôpital, Créteil, Sainte-Geneviève, Résidence, Épinay — c'est-à-
 * dire une grande partie des noms d'établissements médico-sociaux.
 *
 * Ce n'est pas un confort de saisie : c'est l'écran dont le seul métier est
 * d'empêcher le doublon d'établissement, le plus coûteux des trois, celui qui
 * coupe une équipe en deux. Quelqu'un qui tape son établissement sans accent
 * (ce que fait un clavier de téléphone) ne trouve rien, conclut qu'il n'existe
 * pas encore, et en crée un second.
 *
 * ⚠ POURQUOI `translate` CÔTÉ SQL ET PAS `unaccent`. `unaccent()` demande une
 * extension PostgreSQL, que le déploiement (un `prisma db push` au démarrage)
 * ne pose pas : la requête tomberait en production et pas en test — le pire
 * des deux mondes. `translate` est du SQL standard, présent partout, et il est
 * IMMUTABLE : le jour où le volume l'exigera, il pourra porter un index
 * d'expression sans que rien ne change ici.
 */

/**
 * Les deux moitiés de la table passée à `translate(texte, ACCENTS, PLATS)`.
 *
 * ⚠ CARACTÈRE POUR CARACTÈRE, ET DE MÊME LONGUEUR. `translate` associe le
 * n-ième caractère de la source au n-ième de la cible ; deux chaînes de
 * longueurs différentes décalent silencieusement toutes les correspondances
 * suivantes — « é » deviendrait « c », et la recherche rendrait n'importe quoi
 * sans jamais lever d'erreur. Un test vérifie l'égalité des longueurs.
 *
 * ⚠ AUCUNE LIGATURE ICI. « œ » vaudrait deux lettres (« oe ») et casserait la
 * correspondance un pour un. C'est sans conséquence : personne ne cherche un
 * établissement en tapant « œ » d'un côté et « oe » de l'autre.
 */
export const ACCENTS_SQL = 'àâäáãåçéèêëíìîïñóòôöõúùûüýÿÀÂÄÁÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝ';
export const PLATS_SQL = 'aaaaaaceeeeiiiinooooouuuuyyAAAAAACEEEEIIIINOOOOOUUUUY';

/**
 * Le texte cherché, ramené à la même forme que ce que `translate` produira
 * côté base : minuscules, sans accents.
 *
 * ⚠ LES JOKERS DE `LIKE` SONT ÉCHAPPÉS. Sans cela, quelqu'un qui tape « 100 % »
 * ou « foyer_nord » interroge la base avec des jokers : `%` ramène tout, `_`
 * remplace n'importe quel caractère. Ce n'est pas une injection (la valeur reste
 * un paramètre lié), mais des résultats faux, et sur cet écran des résultats
 * faux font créer un doublon.
 */
export function motifRecherche(texte: string): string {
  const sansAccent = (texte ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
  return `%${sansAccent.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
}
