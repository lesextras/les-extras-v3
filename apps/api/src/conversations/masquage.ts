/**
 * MASQUAGE DES COORDONNÉES DANS UN FIL AVEC UN INTERVENANT.
 *
 * ⚠ CE FICHIER PROTÈGE LE MODÈLE ÉCONOMIQUE, pas la vie privée.
 *
 * Une place de marché meurt de la même façon : le premier échange sert à
 * s'envoyer un numéro de téléphone, la prestation se négocie ailleurs, et la
 * plateforme ne voit plus jamais ni la réservation, ni le contrat, ni la
 * facture — c'est-à-dire ni les conventions qu'elle édite, ni la trace qui
 * protège l'établissement en cas de litige.
 *
 * Tant qu'une demande n'est pas CONFIRMÉE, les coordonnées personnelles sont
 * donc retirées du corps du message. Une fois la réservation confirmée, tout
 * passe en clair : les deux parties doivent pouvoir s'appeler le matin de
 * l'intervention.
 *
 * TROIS RÈGLES DE CONCEPTION, à tenir :
 *
 *  1. ON NE BLOQUE PAS L'ENVOI. Le message part, amputé, et son auteur en est
 *     informé (`coordonneesMasquees`). Refuser le message ferait perdre le
 *     texte utile qu'il contient, et pousserait simplement à écrire le numéro
 *     autrement — on n'aurait rien gagné et on aurait fâché quelqu'un.
 *  2. ON NE TOUCHE QU'À CE QU'ON RECONNAÎT VRAIMENT. Un faux positif sur
 *     « 12 enfants de 6 à 11 ans » rendrait la messagerie inutilisable dans un
 *     secteur qui parle en effectifs et en âges toute la journée.
 *  3. LE MASQUAGE EST UN RALENTISSEUR, PAS UN COFFRE. Quelqu'un de déterminé
 *     écrira son numéro en toutes lettres. Ce n'est pas grave : le but est que
 *     le chemin le plus simple reste celui qui passe par la plateforme.
 */

const REMPLACEMENT = '[coordonnées masquées]';

/**
 * Adresses de courriel, y compris les écritures détournées les plus courantes :
 * « nom (at) domaine.fr », « nom [arobase] domaine point fr ».
 */
const COURRIEL =
  /[a-z0-9._%+-]+\s*(?:@|\(\s*at\s*\)|\[\s*at\s*\]|\(\s*arobase\s*\)|\[\s*arobase\s*\]|\s+arobase\s+)\s*[a-z0-9.-]+\s*(?:\.|\s*\(\s*point\s*\)\s*|\s*\[\s*point\s*\]\s*|\s+point\s+)\s*[a-z]{2,10}/gi;

/**
 * Numéros de téléphone français et internationaux.
 *
 * Volontairement ancré sur un DÉBUT plausible (0, +33, 00 33) : sans cela, la
 * règle attraperait n'importe quelle suite de chiffres, et un compte rendu
 * d'atelier en est plein.
 */
const TELEPHONE =
  /(?:(?:\+|00\s?)33\s?\(?0?\)?|\b0)\s?[1-9](?:[\s.\-–/]?\d{2}){4}\b/g;

/** Suite de 10 chiffres collés commençant par 0 — la forme la plus fréquente. */
const TELEPHONE_COLLE = /\b0\d{9}\b/g;

/** Liens, y compris sans protocole (« monsite.fr/contact »). */
const LIEN =
  /\b(?:https?:\/\/|www\.)[^\s<>"']+|\b[a-z0-9-]+\.(?:fr|com|net|org|eu|io|be|ch)(?:\/[^\s<>"']*)?\b/gi;

/** Identifiants de messagerie tierce, écrits en clair. */
const RESEAU =
  /\b(?:whatsapp|whats app|wattsapp|telegram|signal|messenger|snap(?:chat)?|instagram|insta|linkedin|facebook|skype)\b\s*[:=]?\s*[^\s,.;]{0,40}/gi;

export interface ResultatMasquage {
  /** Le corps du message, coordonnées retirées. */
  texte: string;
  /** Vrai si quelque chose a été retiré — on le dit à l'auteur. */
  masque: boolean;
}

/**
 * Retire les coordonnées d'un texte.
 *
 * ⚠ L'ordre compte : le courriel passe AVANT le lien, sinon la partie
 * « domaine.fr » d'une adresse serait avalée par la règle des liens et
 * l'adresse ressortirait amputée mais lisible.
 */
export function masquerCoordonnees(texte: string): ResultatMasquage {
  const source = texte ?? '';
  let sortie = source;

  for (const regle of [COURRIEL, RESEAU, LIEN, TELEPHONE, TELEPHONE_COLLE]) {
    // Les expressions sont globales : on remet leur curseur à zéro avant
    // chaque usage, sinon un appel sur deux repart du milieu du texte.
    regle.lastIndex = 0;
    sortie = sortie.replace(regle, REMPLACEMENT);
  }

  // Deux marqueurs qui se suivent (un courriel ET un téléphone collés) se
  // réduisent à un seul : lire trois fois la même mention n'apprend rien.
  sortie = sortie.replace(
    new RegExp(`(?:${escaper(REMPLACEMENT)}[\\s,;.]*){2,}`, 'g'),
    `${REMPLACEMENT} `,
  );

  return { texte: sortie.trim(), masque: sortie !== source };
}

function escaper(v: string): string {
  return v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * La phrase affichée à l'auteur quand son message a été amputé.
 *
 * Elle dit POURQUOI, et quand cela cessera. Un masquage silencieux passerait
 * pour une panne, et un masquage sans explication pour de la rétention.
 */
export const EXPLICATION_MASQUAGE =
  'Vos coordonnées ont été retirées de ce message : les échanges directs ' +
  'passent par la plateforme tant que l’intervention n’est pas confirmée. ' +
  'Dès la confirmation, vous pourrez échanger vos coordonnées librement.';
