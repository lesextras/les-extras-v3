import { AssistantTrame } from '@prisma/client';

/**
 * LA MÉMOIRE DES SITUATIONS — ce que LEX a déjà écrit sur quelqu'un.
 *
 * ⚠ CE MANQUE ÉTAIT ÉCRIT NOIR SUR BLANC DEPUIS LE 25/08/2026, dans le
 * commentaire de `RegistrePseudoService` : « un rapport de situation repart de
 * zéro là où il devrait écrire une évolution ». Le registre des pseudonymes
 * avait été construit pour rendre ce chaînage possible ; il n'a jamais été
 * branché. Résultat : un rapport trimestriel ne pouvait pas écrire « depuis le
 * précédent rapport », parce que LEX n'avait aucun moyen de savoir qu'un
 * précédent rapport existait, ni de qui il parlait.
 *
 * Ce fichier porte les règles de cette mémoire. Trois décisions y sont prises,
 * et chacune protège quelque chose.
 *
 * 1. LA MÉMOIRE NE VAUT PAS POUR TOUS LES ÉCRITS.
 *    Une note d'observation consigne CE QUI S'EST PASSÉ AUJOURD'HUI. Lui
 *    donner les écrits précédents, c'est l'inviter à relire le passé au lieu
 *    de regarder la journée, et à teinter des faits bruts par ce qu'on sait
 *    déjà. Le secteur appelle ça un biais de confirmation, et il coûte cher
 *    quand un juge lit le document. La mémoire ne sert donc que les écrits de
 *    SYNTHÈSE, ceux dont le métier est précisément de couvrir une période.
 *
 * 2. ELLE NE FRANCHIT NI LE COMPTE, NI L'AUTEUR.
 *    `listerDocuments` cloisonne déjà par auteur, en disant pourquoi : « un
 *    écrit professionnel n'a pas vocation à circuler par défaut ». La mémoire
 *    respecte exactement la même frontière. Un éducateur ne découvre pas, par
 *    le biais de LEX, ce qu'un collègue a écrit sur un jeune.
 *
 * 3. ELLE NE VOYAGE QU'EN PSEUDONYMES.
 *    Le document enregistré porte les vrais noms, parce qu'il vit dans le
 *    compte. Avant de repartir vers le modèle, il repasse par le masque et par
 *    le registre : le moteur relit « M.D-1 », comme dans les notes du jour.
 *    C'est ce qui fait que les deux textes parlent de la même personne sans
 *    qu'aucun nom ne quitte la maison.
 */

/**
 * Les trames dont le métier est de couvrir une période, et pour lesquelles
 * ignorer l'écrit précédent produit un document faux.
 *
 * ⚠ `NOTE_OBSERVATION`, `TRANSMISSION` et `COMPTE_RENDU_ATELIER` en sont
 * volontairement absentes : elles décrivent un moment, pas un parcours.
 * Les deux courriers aussi : on n'écrit pas à une famille ou à un partenaire
 * en récapitulant un dossier qu'ils n'ont pas demandé.
 */
export const TRAMES_AVEC_MEMOIRE: readonly AssistantTrame[] = [
  AssistantTrame.RAPPORT_SITUATION,
  AssistantTrame.SYNTHESE_REUNION,
  AssistantTrame.BILAN_FIN_ACCOMPAGNEMENT,
];

/** Cette trame gagne-t-elle à relire ce qui précède ? */
export function trameAvecMemoire(trame: AssistantTrame): boolean {
  return TRAMES_AVEC_MEMOIRE.includes(trame);
}

/**
 * Combien d'écrits antérieurs on relit.
 *
 * Deux, pas dix. Au-delà, le modèle passe plus de temps à résumer le passé
 * qu'à traiter les notes du jour, et la facture de jetons grimpe pour un
 * résultat plus plat. Deux suffisent à écrire une évolution : le précédent, et
 * celui d'avant pour donner la pente.
 */
export const NOMBRE_ANTERIEURS = 2;

/**
 * Longueur retenue par écrit antérieur.
 *
 * On coupe à la fin, pas au début : la synthèse et les perspectives d'un
 * rapport se trouvent dans ses derniers paragraphes, et c'est cela qu'il faut
 * confronter à la période nouvelle.
 */
export const LONGUEUR_ANTERIEUR = 2400;

/** Garde la fin d'un texte, en repartant proprement d'un début de phrase. */
export function extraitUtile(texte: string, limite = LONGUEUR_ANTERIEUR): string {
  const propre = texte.trim();
  if (propre.length <= limite) return propre;
  const queue = propre.slice(propre.length - limite);
  const debut = queue.search(/[.!?]\s|\n/);
  return (debut > 0 && debut < 400 ? queue.slice(debut + 1) : queue).trim();
}

/** Les pseudonymes stables présents dans un texte : « [M.D-1] » → « M.D-1 ». */
export function sujetsDuTexte(texte: string): string[] {
  const trouves = new Set<string>();
  for (const [, code] of texte.matchAll(/\[([A-ZÀ-Ý](?:\.[A-ZÀ-Ý])?-\d+)\]/g)) {
    trouves.add(code);
  }
  return [...trouves].sort();
}

export interface EcritAnterieur {
  titre: string;
  /** Date lisible, déjà formatée par l'appelant. */
  quand: string;
  /** Contenu pseudonymisé, déjà raccourci. */
  extrait: string;
}

/**
 * Le bloc d'antériorité ajouté au message envoyé au modèle.
 *
 * ⚠ LES CONSIGNES COMPTENT AUTANT QUE LE CONTENU. Sans elles, un modèle à qui
 * l'on donne un ancien rapport le recopie : on obtient un document qui répète
 * le trimestre précédent en changeant trois mots, et c'est pire que pas de
 * mémoire du tout. Les quatre règles ci-dessous ont été écrites contre ce
 * travers précis.
 */
export function blocAnteriorite(ecrits: readonly EcritAnterieur[]): string {
  if (ecrits.length === 0) return '';
  const corps = ecrits
    .map((e) => `### ${e.titre} (${e.quand})\n${e.extrait}`)
    .join('\n\n');
  return `ÉCRITS PRÉCÉDENTS SUR LA MÊME PERSONNE, pour situer la période.

Ce qui suit a déjà été rédigé et transmis. Ce n'est PAS de la matière à
reprendre, c'est le point de départ dont tu mesures l'écart.

Règles pour t'en servir :
1. Tu écris ce qui a CHANGÉ depuis. Une situation stable se dit en une phrase, pas en un paragraphe recopié.
2. Tu ne présentes jamais un fait ancien comme s'il venait de se produire.
3. Si les notes du jour contredisent un écrit précédent, tu retiens les notes du jour, et tu signales l'écart sans trancher (« la situation décrite en mars ne se retrouve pas sur cette période »).
4. Si ces écrits ne concernent pas ce que tu dois rédiger, tu les ignores entièrement, sans le mentionner.

${corps}

FIN DES ÉCRITS PRÉCÉDENTS. Ce qui suit est la matière nouvelle.

`;
}
