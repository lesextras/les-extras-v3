/**
 * LES URL DE L'ANCIEN WORDPRESS.
 *
 * Jusqu'au 10 août 2026, `les-extras.fr` servait WordPress. Ses articles
 * vivaient à la RACINE (`/mon-article/`), sans préfixe — et ils y sont indexés
 * depuis des années. Depuis l'inversion des domaines, ces mêmes adresses
 * tombent sur le 404 du SaaS alors que le contenu, lui, a bien été repris.
 *
 * On redirige slug par slug, jamais par joker : un `/:slug` à la racine
 * avalerait `/ateliers`, `/contact` et toutes les routes de l'application.
 *
 * Chaque entrée a été vérifiée contre les articles RÉELLEMENT publiés
 * (`/api/articles/feed`), pas contre un code HTTP : `/edublog/<inconnu>`
 * répond 200 avec « Actualité introuvable », donc tester le code 200 ne prouve
 * rien. Les articles de démonstration du thème WordPress (hello-world,
 * top-trends-in-interior-design…) ne sont pas redirigés : ils n'ont jamais eu
 * leur place sur un site du médico-social.
 */
const ARTICLES_MEME_SLUG = [
  'accompagnement-jeunes-majeurs',
  'activite-physique-adaptee-etablissement',
  'analyse-pratiques-professionnelles-educateur',
  'atelier-estime-de-soi-photo-video',
  'atelier-psycho-boxe',
  'formation-qualiopi-accueil-public-difficile',
  'gestion-violence-etablissement',
];

/**
 * Ceux que la reprise a renommés. Six articles avaient été ressaisis à la main
 * en session antérieure, sous un slug engendré depuis le titre accentué ; ce
 * sont eux qui sont restés en ligne, avec leur image de couverture. L'ancienne
 * adresse doit donc pointer vers la nouvelle, pas l'inverse.
 */
const ARTICLES_RENOMMES = {
  'atelier-individuel-ou-collectif': 'atelier-individuel-ou-collectif-comment-choisir-en-e-tablissement',
  'atelier-socio-esthetique': 'l-atelier-socio-esthe-tique-en-e-tablissement-me-dico-social',
  'atelier-socio-esthetique-2': 'atelier-socio-esthe-tique-redonner-une-image-positive-de-soi',
  'atelier-theatre-medico-social': 'l-atelier-the-a-tre-en-e-tablissement-me-dico-social',
  'bilan-competences-educateur': 'bilan-de-compe-tences-e-ducateur-pourquoi-l-envisager-pour-votre-e-quipe',
  'bilan-competences-educateur-2': 'bilan-de-compe-tences-e-ducateur-pourquoi-l-envisager-pour-votre-e-quipe',
  'educateurs-professeurs-coachs-donnez-un-nouvel-elan-a-votre-carriere-avec-les-extras': 'e-ducateurs-professeurs-coachs-donnez-un-nouvel-e-lan-a-votre-carrie-re-avec-les',
  'musicotherapie-etablissement-medico-social': 'la-musicothe-rapie-en-e-tablissement-me-dico-social',
  'recrutement-educateur-freelance': 'recrutement-e-ducateur-freelance-bien-cadrer-un-renfort-d-e-quipe',
};

/**
 * Les PAGES de l'ancien WordPress, quand le SaaS a un équivalent. Celles qui
 * n'en ont pas (boutique, panier, mon-compte — la vieille boutique
 * WooCommerce) gardent leur 404 : mieux vaut une page introuvable qu'une
 * redirection qui ment sur ce qu'on va trouver.
 */
const PAGES_WORDPRESS = {
  '/blog': '/edublog',
  '/services': '/ateliers',
  '/mentions-legales': '/legal',
  '/privacy-policy': '/legal',
  '/demander-votre-catalogue-2026': '/catalogue',
  '/demande-de-devis': '/contact',
  '/devenir-freelance': '/intervenant-independant',
  '/les-extras': '/',
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Le typage et le lint bloquent le build : une régression ne doit jamais
  // pouvoir atteindre la production sans être vue.
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    typedRoutes: false,
  },
  images: {
    // Liste blanche stricte : un joker sur le hostname transforme
    // l'optimiseur d'images en proxy ouvert exploitable par n'importe qui.
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'les-extras.fr' },
      { protocol: 'https', hostname: 'www.les-extras.fr' },
      { protocol: 'https', hostname: 'app.les-extras.fr' },
      { protocol: 'https', hostname: 'api.les-extras.fr' },
      { protocol: 'https', hostname: 'adepa77.fr' },
      { protocol: 'https', hostname: 'www.adepa77.fr' },
      { protocol: 'https', hostname: 'toulali.fr' },
      { protocol: 'https', hostname: 's3.adepa77.fr' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  async rewrites() {
    return [];
  },
  // Les URL /actualites ont été indexées avant le passage à « Édublog » :
  // on les redirige définitivement pour ne perdre ni le référencement ni les
  // liens déjà partagés.
  async redirects() {
    return [
      { source: "/intervenants", destination: "/intervenant-independant", permanent: true },
      { source: '/actualites', destination: '/edublog', permanent: true },
      { source: '/actualites/:slug', destination: '/edublog/:slug', permanent: true },
      ...ARTICLES_MEME_SLUG.map((slug) => ({
        source: `/${slug}`,
        destination: `/edublog/${slug}`,
        permanent: true,
      })),
      ...Object.entries(ARTICLES_RENOMMES).map(([ancien, neuf]) => ({
        source: `/${ancien}`,
        destination: `/edublog/${neuf}`,
        permanent: true,
      })),
      ...Object.entries(PAGES_WORDPRESS).map(([source, destination]) => ({
        source,
        destination,
        permanent: true,
      })),
      // « Congés & compteurs » a fusionné avec « Temps de travail » le
      // 12/08/2026 : c'était le même sujet à deux adresses. Les liens déjà
      // envoyés par courriel continuent de fonctionner.
      { source: '/dashboard/conges', destination: '/dashboard/temps-de-travail', permanent: true },
      { source: '/listing/:slug', destination: '/ateliers', permanent: true },
      { source: '/listing-category/:slug', destination: '/ateliers', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://api.les-extras.fr; frame-src https://www.youtube-nocookie.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
