/**
 * Origine d'une demande, pour l'attribution : utm_source de l'URL si présent,
 * sinon domaine référent, sinon « direct ». Aucune donnée personnelle, aucun
 * cookie — juste de quoi savoir où investir son temps de communication.
 */
export function sourceAcquisition(): string {
  if (typeof window === 'undefined') return 'direct';
  try {
    const params = new URLSearchParams(window.location.search);
    const utm = params.get('utm_source') || params.get('source');
    if (utm) return utm.slice(0, 60).toLowerCase();
    const ref = document.referrer;
    if (!ref) return 'direct';
    const hote = new URL(ref).hostname.replace(/^www\./, '');
    if (hote === window.location.hostname) return 'direct';
    return hote.slice(0, 60);
  } catch {
    return 'direct';
  }
}
