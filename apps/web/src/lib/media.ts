/**
 * Visuels du catalogue — réparation d'affichage.
 *
 * Les fiches ateliers et formations ont été saisies du temps où
 * `les-extras.fr` servait WordPress : leurs visuels sont enregistrés en base
 * sous la forme `https://les-extras.fr/wp-content/uploads/…`.
 *
 * Depuis l'inversion des domaines du 10/08/2026, `les-extras.fr` sert cette
 * application et la médiathèque WordPress a suivi sur `app.les-extras.fr`.
 * `nettoyer-edublog.js --wordpress=` avait basculé les liens des ARTICLES,
 * pas les visuels du catalogue : les URL enregistrées répondent donc toutes
 * en 404, et les cartes affichaient une image cassée.
 *
 * On réécrit l'hôte à l'affichage. C'est un filet, pas la réparation de fond :
 * `apps/api/prisma/basculer-visuels-catalogue.js` corrige la base une bonne
 * fois. Une fois ce script passé, ce module devient un no-op.
 */

/** Hôtes qui ne servent plus la médiathèque WordPress. */
const HOTES_HERITES = new Set(['les-extras.fr', 'www.les-extras.fr']);

/** Hôte qui la sert aujourd'hui (domaine parqué Hostinger). */
const MEDIATHEQUE = 'app.les-extras.fr';

/**
 * Visuels écartés, par chemin de médiathèque.
 *
 * `handicap-psychique.jpg` est le portrait en gros plan d'une enfant, visage
 * entièrement reconnaissable. Sur la carte d'un atelier proposé en MECS ou en
 * IME, il laisse entendre que cette enfant est accueillie dans l'établissement.
 * Rien ne permet d'affirmer qu'un accord a été recueilli pour cet usage, et le
 * doute ne se plaide pas sur l'image d'un mineur : on passe au visuel suivant
 * de la fiche. À remplacer proprement depuis l'administration.
 */
const VISUELS_ECARTES = new Set([
  '/wp-content/uploads/2025/01/handicap-psychique.jpg',
  '/wp-content/uploads/2025/02/handicap-psychique.jpg',
]);

/**
 * Normalise une URL de visuel. Renvoie `null` si le visuel est inutilisable
 * (vide ou écarté). Les chemins relatifs (`/api/files/…`) passent tels quels.
 */
export function visuel(src?: string | null): string | null {
  const valeur = src?.trim();
  if (!valeur) return null;

  if (!/^https?:\/\//i.test(valeur)) {
    return VISUELS_ECARTES.has(valeur) ? null : valeur;
  }

  let url: URL;
  try {
    url = new URL(valeur);
  } catch {
    return valeur;
  }

  if (VISUELS_ECARTES.has(url.pathname)) return null;

  if (HOTES_HERITES.has(url.hostname) && url.pathname.startsWith('/wp-content/')) {
    url.hostname = MEDIATHEQUE;
    return url.toString();
  }

  return valeur;
}

/** Liste de visuels nettoyée, dans l'ordre d'origine. */
export function visuels(images?: readonly (string | null)[] | null): string[] {
  const sortie: string[] = [];
  for (const brut of images ?? []) {
    const propre = visuel(brut);
    if (propre) sortie.push(propre);
  }
  return sortie;
}

/** Premier visuel affichable d'une fiche, ou `null`. */
export function premierVisuel(images?: readonly (string | null)[] | null): string | null {
  return visuels(images)[0] ?? null;
}
