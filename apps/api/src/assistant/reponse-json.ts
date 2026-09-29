import { ServiceUnavailableException } from '@nestjs/common';

/**
 * QUAND LE MOTEUR RÉPOND EN JSON AU LIEU D'UN ÉCRIT (29/09/2026).
 *
 * Constaté par un audit externe, en mode « strictement factuel » : le moteur a
 * rendu un objet JSON au lieu du texte demandé, coupé au milieu
 * (`{"faits_observes": "...", "elements_d_analyse": `). L'éditeur l'affichait
 * tel quel, avec les boutons de validation et d'export : un fragment de code
 * pouvait partir dans un dossier.
 *
 * Deux cas :
 *  - le JSON est COMPLET : on le remet en forme d'écrit (une rubrique par clé,
 *    une puce par élément de liste), sans rien ajouter ni retirer ;
 *  - le JSON est COUPÉ : on refuse. L'erreur fait rembourser le crédit
 *    (`CreditsService.avecCredit` rend le crédit sur un rejet) et la personne
 *    relance, au lieu de recevoir un document incomplet.
 */
export function ecritDepuisJsonEventuel(texte: string): string {
  const nu = texte.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  if (!nu.startsWith('{') && !nu.startsWith('[')) return texte;
  let valeur: unknown;
  try {
    valeur = JSON.parse(nu);
  } catch {
    throw new ServiceUnavailableException(
      'Le brouillon est arrivé incomplet. Votre crédit vous est rendu : relancez la génération.',
    );
  }
  const lignes: string[] = [];
  const titre = (cle: string) =>
    cle
      .replace(/_d_/g, ' d’')
      .replace(/_l_/g, ' l’')
      .replace(/[_-]+/g, ' ')
      .trim()
      .toUpperCase();
  const ecrire = (v: unknown, niveau: number) => {
    if (v === null || v === undefined || v === '') return;
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      lignes.push(String(v).trim(), '');
      return;
    }
    if (Array.isArray(v)) {
      for (const x of v) {
        if (x && typeof x === 'object') ecrire(x, niveau + 1);
        else if (x !== null && x !== undefined && String(x).trim()) lignes.push(`• ${String(x).trim()}`);
      }
      lignes.push('');
      return;
    }
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      if (x === null || x === undefined || x === '' || (Array.isArray(x) && !x.length)) continue;
      lignes.push(titre(k), '');
      ecrire(x, niveau + 1);
    }
  };
  ecrire(valeur, 0);
  const sortie = lignes.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  if (!sortie) {
    throw new ServiceUnavailableException('Le brouillon est arrivé vide. Votre crédit vous est rendu : relancez la génération.');
  }
  return sortie;
}
