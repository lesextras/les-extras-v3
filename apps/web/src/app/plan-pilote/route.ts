import { chargerChemin as cheminAssociation } from '../association/_chemin';
import { chargerChemin as cheminAcademie } from '../academie/_chemin';

/**
 * LE PLAN DU SITE DE pilote.toulali.fr (servi à /sitemap.xml par le middleware).
 *
 * Le plan partagé listait les pages de Les Extras : aucun moteur ne voyait
 * Pilote. Seules les pages publiques y figurent ; les étapes sont relues à
 * l'API, un chemin injoignable laisse simplement les pages fixes.
 */
export const revalidate = 3600;

const BASE = 'https://pilote.toulali.fr';
const FIXES = [
  '/', '/association', '/chemin', '/centre-d-aide', '/nous-contacter', '/inscription', '/legal', '/legal/dpa',
  '/academie', '/academie/chemin', '/academie/certification', '/academie/centre-d-aide', '/academie/nous-contacter', '/academie/inscription',
];

export async function GET() {
  const [asso, acad] = await Promise.all([cheminAssociation().catch(() => null), cheminAcademie().catch(() => null)]);
  const urls = [
    ...FIXES,
    ...(asso?.etapes ?? []).map((e: { slug: string }) => `/chemin/${e.slug}`),
    ...(acad?.etapes ?? []).map((e: { slug: string }) => `/academie/chemin/${e.slug}`),
  ];
  const corps = urls.map((u) => `<url><loc>${BASE}${u === '/' ? '' : u}</loc></url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${corps}</urlset>`, {
    headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  });
}
