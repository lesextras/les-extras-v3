/**
 * CE QUI IDENTIFIE UNE MINI-FORMATION, D'UN BOUT À L'AUTRE DU SITE.
 *
 * L'emoji d'un parcours apparaît à trois endroits : sur sa couverture
 * (`scripts/couvertures-mini-formations.py`), sur sa fiche récap A4
 * (`scripts/mini-formations/fiches-recap-data.js`) et sur ses cartes — celle du
 * catalogue et celle du carrousel d'accueil. C'est lui qu'on retient d'un
 * parcours avant d'avoir lu son titre, donc il ne doit exister qu'en un seul
 * endroit dans le code du site, sans quoi deux cartes de la même formation
 * finiront par ne plus porter le même dessin.
 *
 * Les valeurs sont en dur, et c'est assumé : les mettre en base demanderait une
 * colonne de plus pour dix lignes qui ne bougent jamais, et une carte sans
 * emoji reste parfaitement lisible — les appelants utilisent `?? null`.
 */
export const EMOJI_PARCOURS: Record<string, string> = {
  "les-quatre-fonctions-d-un-comportement": "🔍",
  "apprendre-a-demander-plutot-qu-a-crier": "💬",
  "guider-puis-s-effacer": "🪜",
  "decomposer-une-routine-en-etapes": "🔗",
  "rendre-l-environnement-previsible": "🗓️",
  "les-premieres-minutes-d-une-crise": "⏱️",
  "l-enfant-qui-dit-non-a-tout": "🙅",
  "lire-un-comportement-comme-une-reaction-de-survie": "🧭",
  "preparer-une-equipe-de-suivi-de-la-scolarisation": "🏫",
  "aider-a-demarrer-une-tache": "🚀",
};

/**
 * LES FORMATIONS DE LA MAISON.
 *
 * Le catalogue accueillera des formations conçues par des organismes du
 * réseau. Celles que l'association écrit et tient elle-même n'ont pas à se
 * perdre au milieu : ce sont les seules dont elle répond de la ligne à la
 * ligne, et les seules gratuites.
 *
 * Le test porte sur le nom du compte propriétaire, seule donnée disponible
 * côté public. Le jour où un second organisme s'appellera « ADéPA quelque
 * chose », il faudra un drapeau en base ; d'ici là, une constante suffit.
 */
export const ORGANISME_MAISON = "ADéPA";

export function estMaison(nom?: string | null): boolean {
  return Boolean(nom?.startsWith(ORGANISME_MAISON));
}

/** « 45 min » ou « 7 h » — on affiche celui des deux champs qui est rempli. */
export function dureeLisible(f: {
  durationHours?: number | null;
  durationMinutes?: number | null;
}): string | null {
  if (f.durationHours) return `${f.durationHours} h`;
  if (f.durationMinutes) return `${f.durationMinutes} min`;
  return null;
}
