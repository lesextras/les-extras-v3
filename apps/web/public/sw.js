/*
 * Service worker — LES EXTRAS (écrit à la main, sans dépendance).
 *
 * PRINCIPE DE PRUDENCE : cette plateforme manipule des données médico-sociales
 * et des sessions authentifiées. Un cache trop agressif afficherait des données
 * périmées, ou pire, celles d'un autre utilisateur. On ne met donc en cache QUE
 * des ressources statiques immuables et publiques :
 *
 *   MIS EN CACHE (cache-first) :
 *     - /_next/static/**  (assets fingerprintés par le build → immuables)
 *     - /icons/**         (icônes PWA)
 *
 *   JAMAIS INTERCEPTÉ (toujours le réseau, jamais stocké) :
 *     - toute requête non-GET
 *     - toute requête cross-origin
 *     - /api/** et /_next/image (données, images signées)
 *     - toutes les navigations (request.mode === 'navigate') : pages HTML
 *       authentifiées, contrats, factures, dossiers…
 *     - toute réponse non-200, opaque, partielle (206) ou porteuse d'un
 *       en-tête de cache privé/no-store
 *
 * Pas de mode hors-ligne : on préfère une erreur réseau franche à une donnée
 * médico-sociale périmée.
 */

// Incrémenter la version invalide tout le cache au prochain déploiement.
const CACHE_PREFIX = 'lesextras-static-';
const CACHE_VERSION = 'v1';
const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;

/** Ressources précachées à l'installation (petites, publiques, stables). */
const PRECACHE_URLS = [
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
];

/** Préfixes de chemins dont la mise en cache est autorisée. */
const CACHEABLE_PREFIXES = ['/_next/static/', '/icons/'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      // addAll est « tout ou rien » : on tolère un échec unitaire.
      .then((cache) =>
        Promise.all(PRECACHE_URLS.map((url) => cache.add(url).catch(() => undefined))),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/** Vrai uniquement pour les assets statiques immuables de même origine. */
function isCacheable(request, url) {
  if (request.method !== 'GET') return false;
  if (url.origin !== self.location.origin) return false;
  // Les navigations et les données ne sont jamais servies depuis le cache.
  if (request.mode === 'navigate') return false;
  if (url.pathname.startsWith('/api/') || url.pathname === '/api') return false;
  if (url.pathname.startsWith('/_next/image')) return false;
  if (url.search) return false;
  return CACHEABLE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

/** N'archive que des réponses complètes, publiques et réussies. */
function isStorable(response) {
  if (!response || !response.ok || response.status !== 200) return false;
  if (response.type !== 'basic') return false; // exclut opaque / cors
  const control = response.headers.get('Cache-Control') || '';
  if (/no-store|private/i.test(control)) return false;
  return true;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return; // URL exotique (blob:, data:…) → on laisse passer.
  }

  // Tout le reste (pages, API, POST, cross-origin) part au réseau sans que le
  // service worker n'intervienne : pas de respondWith, pas d'interception.
  if (!isCacheable(request, url)) return;

  event.respondWith(
    caches.match(request, { cacheName: CACHE_NAME }).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (isStorable(response)) {
          const copy = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(request, copy))
            .catch(() => undefined);
        }
        return response;
      });
    }),
  );
});

// Permet à la page de forcer l'activation d'une nouvelle version.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
