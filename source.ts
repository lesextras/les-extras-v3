/**
 * ATTRIBUTION DES CAMPAGNES — premier contact, pas dernier clic.
 *
 * Le piège classique : ne lire les UTM qu'au moment où le formulaire est
 * envoyé. Or un prospect arrive par une annonce, parcourt trois pages, et
 * s'inscrit ensuite. À cet instant l'URL n'a plus d'UTM et le référent est
 * interne : la campagne est perdue, tout retombe en « direct ».
 *
 * On capture donc à l'ARRIVÉE et on conserve pour la durée de la visite.
 * Choix du sessionStorage plutôt qu'un cookie : rien n'est envoyé au serveur
 * à chaque requête, rien ne survit à la fermeture de l'onglet, et cela reste
 * cohérent avec la promesse « aucun traceur ».
 */

const CLE = 'lx.source.v1';

export interface SourceAcquisition {
  /** Compte parrain (?parrain=) : lien de parrainage, tous types de comptes. */
  parrain?: string;
  /** utm_source, sinon domaine référent, sinon « direct ». */
  source: string;
  /** utm_medium : cpc, social, email… */
  medium?: string;
  /** utm_campaign : nom de l'annonce. */
  campaign?: string;
  /** Page d'arrivée : utile pour savoir quelle annonce pointe où. */
  landing?: string;
}

function nettoyer(v: string | null): string | undefined {
  if (!v) return undefined;
  const s = v.trim().slice(0, 60).toLowerCase();
  return s || undefined;
}

/** Lit l'origine dans l'URL courante. Renvoie null si rien d'exploitable. */
function lireUrl(): SourceAcquisition | null {
  try {
    const p = new URLSearchParams(window.location.search);
    const utm = nettoyer(p.get('utm_source') ?? p.get('source'));
    const medium = nettoyer(p.get('utm_medium'));
    const campaign = nettoyer(p.get('utm_campaign'));
    const landing = window.location.pathname.slice(0, 120);

    const parrain = (p.get('parrain') ?? '').trim().slice(0, 60) || undefined;

    if (utm) return { source: utm, medium, campaign, landing, parrain };
    if (parrain) return { source: 'parrainage', landing, parrain };

    // Les régies ajoutent leur propre identifiant de clic, PAS d'UTM : une
    // annonce Facebook publiée sans paramètres de suivi n'arrive qu'avec
    // `fbclid`. Sans ce rattrapage, tout le trafic payant se comptait en
    // « direct » — depuis l'application Facebook le référent est vide, et on
    // ne pouvait plus distinguer une visite achetée d'une visite naturelle.
    const CLICS: Array<[string, string, string]> = [
      ['fbclid', 'facebook', 'paid_social'],
      ['ttclid', 'tiktok', 'paid_social'],
      ['li_fat_id', 'linkedin', 'paid_social'],
      ['gclid', 'google', 'cpc'],
      ['gbraid', 'google', 'cpc'],
      ['wbraid', 'google', 'cpc'],
      ['msclkid', 'bing', 'cpc'],
    ];
    for (const [param, src, moyen] of CLICS) {
      if (p.get(param)) return { source: src, medium: moyen, campaign, landing, parrain };
    }

    const ref = document.referrer;
    if (!ref) return { source: 'direct', landing };
    const hote = new URL(ref).hostname.replace(/^www\./, '');
    if (hote === window.location.hostname) return null; // navigation interne
    return { source: hote.slice(0, 60).toLowerCase(), medium: 'referral', landing };
  } catch {
    return null;
  }
}

/**
 * À appeler une fois par page publique. Mémorise la première origine de la
 * visite et ne l'écrase plus : c'est la campagne qui a amené la personne qui
 * mérite le crédit, pas la page où elle a fini par cliquer.
 */
export function memoriserSource(): void {
  if (typeof window === 'undefined') return;
  try {
    if (window.sessionStorage.getItem(CLE)) return; // déjà attribué
    const s = lireUrl();
    if (!s) return;
    window.sessionStorage.setItem(CLE, JSON.stringify(s));
  } catch {
    /* navigation privée, stockage refusé : on n'attribue pas, tant pis */
  }
}

/** Origine mémorisée au début de la visite, sinon lecture immédiate. */
export function sourceComplete(): SourceAcquisition {
  if (typeof window === 'undefined') return { source: 'direct' };
  try {
    const brut = window.sessionStorage.getItem(CLE);
    if (brut) return JSON.parse(brut) as SourceAcquisition;
  } catch {
    /* on retombe sur la lecture directe */
  }
  return lireUrl() ?? { source: 'direct' };
}

/** Compatibilité : les formulaires publics n'attendent qu'une chaîne. */
export function sourceAcquisition(): string {
  return sourceComplete().source;
}
