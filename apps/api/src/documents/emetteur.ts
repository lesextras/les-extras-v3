import { logoAdepa, LOGO_ADEPA_RATIO } from './logo-adepa';

/**
 * À QUI APPARTIENT LE LOGO IMPRIMÉ EN TÊTE D'UN DOCUMENT.
 *
 * Un devis et une facture portent l'identité de CELUI QUI LES ÉMET, jamais
 * celle de la plateforme. C'est le sens même de ces pièces : le SIRET imprimé
 * en tête engage son porteur, et un logo posé au-dessus d'un SIRET qui n'est
 * pas le sien laisserait croire que l'association émet une facture qu'elle
 * n'émet pas.
 *
 * Aujourd'hui, un seul émetteur a un logo : l'association, pour les documents
 * qu'elle émet elle-même — les devis et factures de formation, et les crédits
 * LEX. Les intervenants indépendants facturent sous leur propre SIRET et n'ont
 * pas déposé de logo ; leurs documents sortent donc sans, ce qui est correct.
 *
 * ── Pourquoi une reconnaissance par le nom, et ce qu'elle vaut ─────────────
 *
 * Le schéma ne distingue pas l'association d'un autre compte établissement :
 * `AccountType` ne connaît que ESTABLISHMENT et FREELANCE. Le produit s'appuie
 * déjà sur le nom pour la retrouver — voir `AdminService`, qui rattache les
 * formations au premier compte dont le nom contient « adepa ». On applique ici
 * la MÊME règle plutôt qu'une seconde, différente, qui divergerait un jour.
 *
 * C'est une reconnaissance par convention, pas par identité : le jour où un
 * autre émetteur voudra son logo, le bon geste sera un champ `logoUrl` sur le
 * compte et un dépôt de fichier, pas une deuxième exception ici.
 */
export interface LogoEmetteur {
  image: Buffer;
  /** largeur / hauteur, pour ne jamais déformer la marque. */
  ratio: number;
}

/** Vrai quand la raison sociale désigne l'association. */
export function estLAssociation(nom: string | null | undefined): boolean {
  if (!nom) return false;
  // Sans accents ni casse : « ADéPA », « ADEPA », « Adepa 77 » sont le même
  // compte, et l'orthographe saisie un jour d'inscription ne doit pas décider
  // si le document sort avec ou sans logo.
  const normalise = nom
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  return normalise.includes('adepa');
}

/**
 * Le logo à imprimer pour cet émetteur, ou `null`.
 *
 * On passe la raison sociale ET le nom d'usage : un compte peut porter
 * « ADéPA » en raison sociale et un nom d'usage différent, ou l'inverse.
 */
export function logoDeLEmetteur(
  legalName: string | null | undefined,
  name?: string | null,
): LogoEmetteur | null {
  if (!estLAssociation(legalName) && !estLAssociation(name)) return null;
  return { image: logoAdepa(), ratio: LOGO_ADEPA_RATIO };
}

/*
 * ── LE LOGO DÉPOSÉ PAR LE COMPTE (`Account.logoUrl`) ───────────────────────
 *
 * Le champ existait déjà — les fiches publiques l'affichent — mais les
 * documents l'ignoraient : seule l'association, reconnue par son nom, sortait
 * avec un logo. Un émetteur qui a déposé le sien passe désormais devant la
 * convention ; l'heuristique par le nom reste le filet pour l'association,
 * dont le logo est embarqué dans le binaire et ne dépend d'aucun réseau.
 *
 * Règles de prudence, parce qu'un PDF de facture ne doit JAMAIS échouer pour
 * une histoire d'image :
 *  - toute défaillance (URL morte, délai, format inconnu, fichier trop gros)
 *    retombe SANS BRUIT sur l'heuristique puis sur « pas de logo » ;
 *  - PNG et JPEG seulement — ce sont les deux formats que PDFKit sait
 *    incruster ; un SVG ou un WebP déposé par erreur est ignoré, pas planté ;
 *  - les dimensions sont lues dans l'en-tête du fichier, pas devinées : un
 *    ratio faux déformerait la marque de l'émetteur sur sa propre facture ;
 *  - un petit cache borné évite de retélécharger l'image à chaque document,
 *    et expire pour qu'un logo remplacé finisse par apparaître.
 */
const DELAI_TELECHARGEMENT_MS = 4000;
const TAILLE_MAX_OCTETS = 2 * 1024 * 1024;
const CACHE_MS = 15 * 60 * 1000;
const CACHE_ENTREES_MAX = 100;

const cacheLogos = new Map<string, { valeur: LogoEmetteur | null; expire: number }>();

/** Dimensions lues dans l'en-tête PNG (IHDR, toujours premier chunk). */
function dimensionsPng(b: Buffer): { largeur: number; hauteur: number } | null {
  if (b.length < 24) return null;
  if (b.readUInt32BE(0) !== 0x89504e47) return null; // ‰PNG
  return { largeur: b.readUInt32BE(16), hauteur: b.readUInt32BE(20) };
}

/** Dimensions lues dans les marqueurs SOF d'un JPEG. */
function dimensionsJpeg(b: Buffer): { largeur: number; hauteur: number } | null {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) return null;
    const marqueur = b[i + 1];
    // SOF0..SOF15 sauf DHT (C4), JPG (C8) et DAC (CC) : eux seuls portent les dimensions.
    if (marqueur >= 0xc0 && marqueur <= 0xcf && marqueur !== 0xc4 && marqueur !== 0xc8 && marqueur !== 0xcc) {
      return { hauteur: b.readUInt16BE(i + 5), largeur: b.readUInt16BE(i + 7) };
    }
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
}

async function chargerLogoDistant(url: string): Promise<LogoEmetteur | null> {
  if (!/^https?:\/\//i.test(url)) return null;

  const maintenant = Date.now();
  const enCache = cacheLogos.get(url);
  if (enCache && enCache.expire > maintenant) return enCache.valeur;

  let valeur: LogoEmetteur | null = null;
  try {
    const controleur = new AbortController();
    const minuteur = setTimeout(() => controleur.abort(), DELAI_TELECHARGEMENT_MS);
    const reponse = await fetch(url, { signal: controleur.signal, redirect: 'follow' });
    clearTimeout(minuteur);
    if (reponse.ok) {
      const octets = Buffer.from(await reponse.arrayBuffer());
      if (octets.length > 0 && octets.length <= TAILLE_MAX_OCTETS) {
        const dims = dimensionsPng(octets) ?? dimensionsJpeg(octets);
        if (dims && dims.largeur > 0 && dims.hauteur > 0) {
          valeur = { image: octets, ratio: dims.largeur / dims.hauteur };
        }
      }
    }
  } catch {
    valeur = null; // Réseau, délai, DNS : l'échec est mémorisé comme « pas de logo ».
  }

  if (cacheLogos.size >= CACHE_ENTREES_MAX) {
    const doyenne = cacheLogos.keys().next().value;
    if (doyenne !== undefined) cacheLogos.delete(doyenne);
  }
  cacheLogos.set(url, { valeur, expire: maintenant + CACHE_MS });
  return valeur;
}

/** Exposé pour les tests : lecture des dimensions sans réseau. */
export const _internals = { dimensionsPng, dimensionsJpeg };

/**
 * Le logo à imprimer pour cet émetteur : son dépôt d'abord, la convention
 * ensuite, rien sinon. C'est LE point d'entrée des générateurs de PDF.
 */
export async function logoPourEmetteur(p: {
  legalName?: string | null;
  name?: string | null;
  logoUrl?: string | null;
}): Promise<LogoEmetteur | null> {
  if (p.logoUrl) {
    const depose = await chargerLogoDistant(p.logoUrl);
    if (depose) return depose;
  }
  return logoDeLEmetteur(p.legalName, p.name);
}
