/**
 * TITRE DE PAGE D'UNE FICHE DU CATALOGUE.
 *
 * Deux problèmes, un seul gabarit.
 *
 * 1. Le catalogue et le centre de formation portent parfois le MÊME intitulé —
 *    « Accueil du public difficile et/ou en difficulté sociale » existe en
 *    atelier et en formation. Les deux fiches sortaient donc avec le titre au
 *    caractère près, et se concurrençaient dans les résultats de recherche au
 *    lieu de se compléter. Ce ne sont pourtant pas la même chose : une fiche
 *    atelier est une intervention à réserver, une fiche formation est une
 *    session du centre de formation. Le type de page ouvre donc le titre, et
 *    reste visible même quand Google tronque la fin.
 *
 * 2. Les intitulés viennent du back-office : personne ne les écrit pour tenir
 *    dans une balise `<title>`. Le gabarit racine ajoutant « · LES EXTRAS »
 *    (13 caractères), il reste 52 caractères pour l'étiquette et l'intitulé si
 *    l'on veut rester sous les 65 affichés. On coupe donc au dernier mot
 *    entier, plutôt que de laisser passer un titre de 80 caractères dont
 *    Google n'affichera de toute façon que le début.
 *
 * Budgets qui en découlent, pour l'intitulé seul :
 *   atelier   → 65 − 13 (« · LES EXTRAS ») − 10 (« Atelier — »)   = 42
 *   formation → 65 − 13 (« · LES EXTRAS ») − 12 (« Formation — ») = 40
 */

/** Longueur du suffixe ajouté par `title.template` du layout racine. */
const SUFFIXE_MARQUE = ' · LES EXTRAS'.length;

/** Plafond visé pour le titre complet, suffixe de marque compris. */
const MAX_TITRE = 65;

const ETIQUETTES = {
  atelier: 'Atelier — ',
  formation: 'Formation — ',
} as const;

export type TypeFiche = keyof typeof ETIQUETTES;

/**
 * Mots-outils qu'on ne laisse pas en fin de coupe : « Accueil du public
 * difficile et/ou en… » se lit mal, « Accueil du public difficile… » se lit.
 */
const MOTS_SUSPENDUS =
  /(?:\s|^)(?:de|du|des|d’|d'|le|la|les|l’|l'|un|une|au|aux|à|en|et|ou|et\/ou|par|pour|sur|dans|avec|chez)$/iu;

/** Coupe au dernier mot entier et signale la coupe par une ellipse. */
function couper(texte: string, budget: number): string {
  // −1 : l'ellipse occupe elle aussi un caractère.
  const brut = texte.slice(0, budget - 1);
  const dernierEspace = brut.lastIndexOf(' ');
  // Un intitulé sans espace (un mot très long) est coupé net : mieux vaut cela
  // qu'un titre réduit à l'étiquette.
  let base = dernierEspace > 0 ? brut.slice(0, dernierEspace) : brut;
  let precedent = '';
  while (base !== precedent) {
    precedent = base;
    base = base.replace(/[\s.,;:/–—-]+$/u, '').replace(MOTS_SUSPENDUS, '');
  }
  return `${base}…`;
}

/**
 * « Atelier — Éveil musical » / « Formation — Éveil musical » : deux fiches
 * homonymes restent deux titres distincts.
 */
export function titreFiche(type: TypeFiche, intitule: string): string {
  const etiquette = ETIQUETTES[type];
  const budget = MAX_TITRE - SUFFIXE_MARQUE - etiquette.length;
  const plat = intitule.replace(/\s+/g, ' ').trim();
  return etiquette + (plat.length <= budget ? plat : couper(plat, budget));
}
