import type { MetadataRoute } from 'next';

/**
 * Manifeste PWA — LES EXTRAS.
 *
 * Servi par Next.js sur /manifest.webmanifest (App Router, Metadata Files API).
 * Rend l'application installable sur l'écran d'accueil : « RenforTeam » est
 * urgent par nature — un éducateur reçoit une mission à 7 h et la consulte sur
 * son téléphone, pas devant un ordinateur.
 *
 * Couleurs alignées sur le design system « Quietly Bold » (src/styles/globals.css) :
 *   - primary teal  #183767  (182 80% 26%)
 *   - fond ivoire   #FAF7F2  (38 44% 96%)
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'LES EXTRAS, Le renfort médico-social',
    short_name: 'Les Extras',
    description:
      "Trouvez un renfort en urgence ou réservez un atelier : la marketplace qui relie les établissements médico-sociaux aux professionnels indépendants.",
    lang: 'fr',
    dir: 'ltr',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    // ⚠ ELLE SE DÉCLARE ELLE-MÊME COMME APPLICATION LIÉE. C'est la seule façon
    // pour `navigator.getInstalledRelatedApps()` de répondre « oui, elle est
    // déjà installée ». Sans elle, la question reste sans réponse, et on
    // propose l'installation à quelqu'un qui a déjà l'icône sur son bureau.
    related_applications: [{ platform: 'webapp', url: '/manifest.webmanifest' }],
    prefer_related_applications: false,
    orientation: 'portrait',
    theme_color: '#183767',
    background_color: '#FAF7F2',
    categories: ['business', 'productivity', 'medical'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    // Raccourcis d'écran d'accueil : uniquement des routes accessibles aux deux
    // rôles (freelance et établissement) pour ne jamais tomber sur un 403.
    shortcuts: [
      {
        name: 'Missions de renfort',
        short_name: 'RenforTeam',
        description: 'Voir les missions de renfort ouvertes',
        url: '/marketplace?type=missions',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Mon planning',
        short_name: 'Planning',
        description: 'Mes interventions confirmées',
        url: '/dashboard/planning',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
    ],
  };
}
