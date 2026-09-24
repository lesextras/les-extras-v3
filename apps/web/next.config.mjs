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
 * LES ADRESSES DONT LES ACCENTS ÉTAIENT CASSÉS (02/09/2026).
 *
 * Douze articles portaient un slug fabriqué par un découpage qui scindait les
 * accents : « théâtre » → « the-a-tre », « médico-social » → « me-dico-social ».
 * La migration `20260902110000_slugs_edublog_accents` corrige la donnée ; ces
 * redirections permanentes gardent en vie les adresses déjà indexées, déjà
 * partagées sur LinkedIn et déjà envoyées par courriel.
 *
 * ⚠️ Les destinations d'`ARTICLES_RENOMMES` ci-dessous pointaient sur ces mêmes
 * slugs cassés : elles ont été mises à jour dans le même mouvement. Renommer
 * les slugs sans y toucher aurait transformé neuf redirections en neuf 404.
 */
const SLUGS_ACCENTS_REPARES = {
  // Atelier individuel ou collectif : comment choisir en établissement ?
  'atelier-individuel-ou-collectif-comment-choisir-en-e-tablissement':
    'atelier-individuel-ou-collectif-comment-choisir-en-etablissement',
  // L’atelier socio-esthétique en établissement médico-social
  'l-atelier-socio-esthe-tique-en-e-tablissement-me-dico-social':
    'l-atelier-socio-esthetique-en-etablissement-medico-social',
  // L’atelier théâtre en établissement médico-social
  'l-atelier-the-a-tre-en-e-tablissement-me-dico-social':
    'l-atelier-theatre-en-etablissement-medico-social',
  // Recrutement éducateur freelance : bien cadrer un renfort d’équipe
  'recrutement-e-ducateur-freelance-bien-cadrer-un-renfort-d-e-quipe':
    'recrutement-educateur-freelance-bien-cadrer-un-renfort-d-equipe',
  // Atelier socio-esthétique : redonner une image positive de soi
  'atelier-socio-esthe-tique-redonner-une-image-positive-de-soi':
    'atelier-socio-esthetique-redonner-une-image-positive-de-soi',
  // Bilan de compétences éducateur : pourquoi l’envisager pour votre équipe
  'bilan-de-compe-tences-e-ducateur-pourquoi-l-envisager-pour-votre-e-quipe':
    'bilan-de-competences-educateur-pourquoi-l-envisager-pour-votre-equipe',
  // La musicothérapie en établissement médico-social
  'la-musicothe-rapie-en-e-tablissement-me-dico-social':
    'la-musicotherapie-en-etablissement-medico-social',
  // Éducateurs, Professeurs, Coachs : Donnez un Nouvel Élan à votre Carrière avec Les Extras !
  'e-ducateurs-professeurs-coachs-donnez-un-nouvel-e-lan-a-votre-carrie-re-avec-les':
    'educateurs-professeurs-coachs-donnez-un-nouvel-elan-a-votre-carriere-avec-les-extras',
  // Échec Scolaire : Lutter Contre Le Décrochage Scolaire
  'e-chec-scolaire-lutter-contre-le-de-crochage-scolaire':
    'echec-scolaire-lutter-contre-le-decrochage-scolaire',
  // Apprendre Le Dessin : Le Matériel Et Les Techniques
  'apprendre-le-dessin-le-mate-riel-et-les-techniques':
    'apprendre-le-dessin-le-materiel-et-les-techniques',
  // Faire Des Fiches De Révision : Optimiser Son Apprentissage
  'faire-des-fiches-de-re-vision-optimiser-son-apprentissage':
    'faire-des-fiches-de-revision-optimiser-son-apprentissage',
  // L’École De La Deuxième Chance
  'l-e-cole-de-la-deuxie-me-chance':
    'l-ecole-de-la-deuxieme-chance',
};

/**
 * Ceux que la reprise a renommés. Six articles avaient été ressaisis à la main
 * en session antérieure, sous un slug engendré depuis le titre accentué ; ce
 * sont eux qui sont restés en ligne, avec leur image de couverture. L'ancienne
 * adresse doit donc pointer vers la nouvelle, pas l'inverse.
 */
const ARTICLES_RENOMMES = {
  'atelier-individuel-ou-collectif': 'atelier-individuel-ou-collectif-comment-choisir-en-etablissement',
  'atelier-socio-esthetique': 'l-atelier-socio-esthetique-en-etablissement-medico-social',
  'atelier-socio-esthetique-2': 'atelier-socio-esthetique-redonner-une-image-positive-de-soi',
  'atelier-theatre-medico-social': 'l-atelier-theatre-en-etablissement-medico-social',
  'bilan-competences-educateur': 'bilan-de-competences-educateur-pourquoi-l-envisager-pour-votre-equipe',
  'bilan-competences-educateur-2': 'bilan-de-competences-educateur-pourquoi-l-envisager-pour-votre-equipe',
  'educateurs-professeurs-coachs-donnez-un-nouvel-elan-a-votre-carriere-avec-les-extras': 'educateurs-professeurs-coachs-donnez-un-nouvel-elan-a-votre-carriere-avec-les-extras',
  'musicotherapie-etablissement-medico-social': 'la-musicotherapie-en-etablissement-medico-social',
  'recrutement-educateur-freelance': 'recrutement-educateur-freelance-bien-cadrer-un-renfort-d-equipe',
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


/**
 * ═══════════════ OFFRE PUBLIQUE : LE RENFORT DE POSTE SORT DE LA VITRINE ═════
 *
 * Décision de Siham, 19/09/2026. Le renfort de POSTE — celui qui se conclut en
 * CDD salarié — n'est plus proposé en ligne : c'est le pilier que le Conseil
 * d'État a fragilisé le 11/02/2025 (n° 491128) et que l'article 70 de la LFSS
 * 2025 plafonne en ESSMS publics depuis le 01/07/2025. Reste RenforTeam assuré
 * par des intervenants INDÉPENDANTS et spécialisés, plus les ateliers et les
 * formations. Le détail du périmètre est dans `src/lib/offre.ts`.
 *
 * Neuf adresses vendaient le montage retiré. Elles NE SONT PAS SUPPRIMÉES —
 * leur code est intact — elles sont redirigées, et elles sortent du sitemap
 * (voir `src/app/sitemap.ts`) dans le même mouvement.
 *
 * ⚠ REDIRECTION, PAS 404 : ces pages portent des années d'ancienneté et des
 * liens déjà partagés. Un 404 jette les deux.
 *
 * ⚠ REDIRECTION TEMPORAIRE (307), PAS PERMANENTE : la décision se reprend en
 * repassant NEXT_PUBLIC_OFFRE_PUBLIQUE à « complete ». Une 308 resterait
 * gravée dans les navigateurs longtemps après que les pages soient revenues.
 *
 * ⚠ ET C'EST BIEN ICI QUE ÇA SE JOUE, PAS DANS LES PAGES. Un `redirect()` dans
 * un composant prérendu ne produit pas de 3xx : mesuré le 21/09/2026, les six
 * routes répondaient 200 en servant la page « Erreur 404 ». Le fichier le
 * documente déjà deux fois plus haut ; c'est la troisième.
 */
const RENFORT_SALARIE_EN_LIGNE =
  (process.env.NEXT_PUBLIC_OFFRE_PUBLIQUE ?? '').trim().toLowerCase() === 'complete';

/**
 * ⚠ LA VISIOCONSULTATION N'EST PAS ENCORE EN SERVICE (21/09/2026).
 *
 * `NEXT_PUBLIC_VISIOCONSULTATION=1` l'allume — et seulement le jour où un vrai
 * rendez-vous passe de bout en bout. D'ici là, `/visio/<jeton>` redirige.
 *
 * ⚠ POURQUOI UNE REDIRECTION ET PAS UN `notFound()` DANS LA PAGE : le
 * `loading.tsx` du groupe `(public)` ouvre une frontière Suspense, la coquille
 * part donc avant que le composant ne s'exécute et la route répond **200** en
 * servant la page « Erreur 404 ». C'est le piège que ce fichier documente
 * déjà trois fois. Mesuré ici aussi, le 21/09.
 */
const VISIO_EN_LIGNE = (process.env.NEXT_PUBLIC_VISIOCONSULTATION ?? '').trim() === '1';

const VISIO_HORS_SERVICE = [
  { source: '/visio/:jeton', destination: '/renforteam', permanent: false },
];

const HORS_OFFRE_PUBLIQUE = [
  // Les pages de mots-clés du remplacement : index, 7 métiers, 6 territoires.
  { source: '/renfort', destination: '/renforteam' },
  { source: '/renfort/metier/:slug', destination: '/renforteam' },
  { source: '/renfort/:ville', destination: '/renforteam' },
  // L'atterrissage publicitaire « un remplaçant en CDD, sans commission ».
  { source: '/l/renfort', destination: '/renforteam' },
  // Les trois pages de comparaison tarifaire, qui chiffrent l'intérim et le
  // remplacement. Elles atterrissent sur la page qui dit ce qu'on facture.
  { source: '/simulateur', destination: '/frais-de-service' },
  { source: '/comparatif-plateformes-remplacement', destination: '/frais-de-service' },
  { source: '/outils/cout-remplacement', destination: '/outils' },
].map((r) => ({ ...r, permanent: false }));

/** @type {import('next').NextConfig} */
/**
 * LES FICHES ATELIER : IDENTIFIANT → ADRESSE LISIBLE, EN VRAIE 308.
 *
 * On ne peut PAS rediriger depuis la page elle-même. `(public)/loading.tsx`
 * ouvre une frontière Suspense : la coquille HTML part avant que le composant
 * ne s'exécute, le statut 200 est déjà joué, et `permanentRedirect()` ne
 * produit alors qu'un saut côté client — invisible pour un robot. C'est le
 * même piège que celui déjà rencontré avec `notFound()` sur ces routes.
 *
 * `redirects()` est asynchrone et s'évalue au DÉMARRAGE du serveur : on y
 * interroge le catalogue une fois et on en tire la table des redirections.
 * Une fiche créée après un démarrage n'y figure pas encore — elle reste
 * servie sur son identifiant, avec sa canonique vers le slug, jusqu'au
 * déploiement suivant. C'est une imperfection, pas une panne.
 *
 * Si l'API ne répond pas, on rend une liste VIDE : un site qui démarre sans
 * ces redirections fonctionne parfaitement ; un site qui ne démarre pas, non.
 */
async function redirectionsFichesAtelier() {
  const base = (
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'https://api.les-extras.fr/api'
  ).replace(/\/$/, '');
  try {
    const reponse = await fetch(`${base}/public/catalog?take=60`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!reponse.ok) return [];
    const { items } = await reponse.json();
    return (items ?? [])
      .filter((f) => f?.id && f?.slug && f.id !== f.slug)
      .map((f) => ({
        source: `/ateliers/${f.id}`,
        destination: `/ateliers/${f.slug}`,
        permanent: true,
      }));
  } catch {
    // Aucune redirection plutôt qu'un démarrage en échec.
    return [];
  }
}

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
      // Médiathèque WordPress. `app.les-extras.fr` est l'hôte sortant,
      // `ialexia.fr` l'entrant : les DEUX doivent être listés pendant la
      // bascule, sinon l'optimiseur d'images répond 400 et les visuels
      // disparaissent — ils ne sont pas juste non optimisés, ils ne
      // s'affichent plus. L'hôte servi est décidé dans `lib/media.ts`.
      { protocol: 'https', hostname: 'app.les-extras.fr' },
      { protocol: 'https', hostname: 'ialexia.fr' },
      { protocol: 'https', hostname: 'www.ialexia.fr' },
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
    const fiches = await redirectionsFichesAtelier();
    return [
      ...fiches,
      // Le renfort de poste hors vitrine — voir le bloc « OFFRE PUBLIQUE »
      // en tête de fichier. Placé AVANT tout le reste : `/renfort/:ville` doit
      // être évalué avant qu'une règle plus générale ne l'attrape.
      ...(RENFORT_SALARIE_EN_LIGNE ? [] : HORS_OFFRE_PUBLIQUE),
      ...(VISIO_EN_LIGNE ? [] : VISIO_HORS_SERVICE),
      /**
       * www → apex, en 301.
       *
       * `www.les-extras.fr` répondait 200 et servait le site ENTIER, avec une
       * canonique vers l'apex. Google indexe donc l'apex mais garde chaque
       * adresse www dans son rapport sous « Autre page avec balise canonique
       * correcte » — c'est le message que remontait la Search Console, et
       * c'est du budget d'exploration dépensé pour rien : deux fois le site.
       *
       * Une canonique est une SUGGESTION ; une 301 est une instruction. On
       * garde le domaine déclaré dans Coolify (le certificat en dépend), on
       * cesse simplement d'y servir une copie.
       *
       * Pas de boucle possible : la condition ne porte que sur l'hôte `www`,
       * la destination est absolue sur l'apex.
       */
      {
        source: '/:chemin*',
        has: [{ type: 'host', value: 'www.les-extras.fr' }],
        destination: 'https://les-extras.fr/:chemin*',
        permanent: true,
      },
      /**
       * « SOS Renfort » est devenu « RenforTeam » le 20/08/2026 — le renfort
       * pour son équipe. L'ancienne adresse est indexée et partagée : elle
       * redirige en 301, qui transmet l'antériorité à la nouvelle.
       *
       * ⚠ MISE À JOUR DU 19/09/2026 : les pages de mots-clés — /renfort,
       * /renfort/<ville>, /renfort/metier/<slug> — NE SONT PLUS SERVIES hors
       * offre complète. Elles portaient « remplacement éducateur spécialisé »,
       * c'est-à-dire exactement l'offre retirée. Voir `HORS_OFFRE_PUBLIQUE`
       * en tête de fichier ; elles reviennent avec la variable.
       */
      { source: '/sos-renfort', destination: '/renforteam', permanent: true },
      { source: "/intervenants", destination: "/intervenant-independant", permanent: true },
      /*
       * ⚠⚠ /freelances/:id — LA REDIRECTION EST REMONTÉE ICI LE 16/09/2026,
       * ET IL NE FAUT PAS LA REDESCENDRE DANS LA PAGE.
       *
       * Elle était faite par `permanentRedirect()` dans
       * `(public)/freelances/[id]/page.tsx`, avec un commentaire disant qu'elle
       * existait pour que Google n'indexe pas l'ancienne fiche appauvrie À LA
       * PLACE de la vraie. Or la frontière Suspense ouverte par
       * `(public)/loading.tsx` fait partir la coquille AVANT que la redirection
       * ne s'exécute : mesuré en direct, la route répondait **200**, avec
       * `index, follow`, et redirigeait seulement côté client. Autrement dit,
       * elle produisait exactement le risque qu'elle décrivait vouloir éviter.
       *
       * Ici, c'est le serveur qui répond 308 avant tout rendu — aucun Suspense
       * ne peut s'intercaler. Même remède que pour les 29 anciennes adresses
       * WordPress plus bas.
       */
      { source: '/freelances/:id', destination: '/intervenants/:id', permanent: true },
      { source: '/actualites', destination: '/edublog', permanent: true },
      { source: '/actualites/:slug', destination: '/edublog/:slug', permanent: true },
      ...ARTICLES_MEME_SLUG.map((slug) => ({
        source: `/${slug}`,
        destination: `/edublog/${slug}`,
        permanent: true,
      })),
      ...Object.entries(SLUGS_ACCENTS_REPARES).map(([casse, propre]) => ({
        source: `/edublog/${casse}`,
        destination: `/edublog/${propre}`,
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
      // Le 23/09/2026, « Temps de travail & congés » (gestion RH interne) sort
      // du produit : Les Extras met en relation, il ne gère pas la paie ni les
      // congés des équipes. L'agenda reste l'endroit où l'on voit qui est là.
      { source: '/dashboard/conges', destination: '/dashboard/planning', permanent: true },
      { source: '/dashboard/temps-de-travail', destination: '/dashboard/planning', permanent: true },
      { source: '/dashboard/mon-poste', destination: '/dashboard/account', permanent: true },
      // Le 24/09/2026, « 1 compte = 1 personne » : plus d'organigramme, plus
      // d'équipe rattachée, plus de module d'organisation ni de matrice des
      // rôles. Les liens déjà envoyés retombent sur le tableau de bord.
      { source: '/dashboard/organigramme', destination: '/dashboard', permanent: true },
      { source: '/dashboard/equipe', destination: '/dashboard', permanent: true },
      { source: '/dashboard/equipe/:path*', destination: '/dashboard', permanent: true },
      { source: '/admin/organisation', destination: '/admin', permanent: true },
      { source: '/admin/roles', destination: '/admin', permanent: true },
      // DEUX PAGES QUI RÉPONDAIENT 200 SUR DU VIDE.
      //
      // Elles appelaient `redirect()` depuis un composant prérendu : Next ne
      // peut alors pas émettre de 3xx et retombe sur un rafraîchissement méta
      // (`<meta http-equiv="refresh" content="1;url=…">`). Le visiteur voyait
      // donc une page blanche pendant une seconde pleine avant d'arriver où il
      // voulait — une seconde payée, un jour de campagne. Et un moteur y lit
      // une redirection molle, qui ne transmet pas les signaux d'une 301.
      //
      // La redirection appartient à la configuration, pas à un composant.
      { source: '/etablissements', destination: '/renforteam', permanent: true },
      /**
       * LE GAP A ÉTÉ RETIRÉ DE L'OFFRE (15/09/2026).
       *
       * /gap, /gap/poser et /gap/<id> étaient indexés, et /entraide pointait
       * déjà dessus. Un 404 sur des adresses référencées coûte au domaine
       * entier, pas seulement à ces pages : on redirige donc en 301, qui
       * transmet l'antériorité à l'accueil.
       *
       * L'ordre compte : la règle la plus spécifique d'abord, sinon `/gap`
       * avalerait ses propres sous-chemins avant qu'ils ne soient évalués.
       */
      { source: '/gap/:chemin*', destination: '/', permanent: true },
      { source: '/gap', destination: '/', permanent: true },
      { source: '/dashboard/gap/:chemin*', destination: '/dashboard', permanent: true },
      { source: '/dashboard/gap', destination: '/dashboard', permanent: true },
      { source: '/entraide', destination: '/', permanent: true },
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
              // MESURE DE CONVERSION : LE TAG ÉTAIT BLOQUÉ PAR NOTRE PROPRE EN-TÊTE.
            //
            // `MesureAudience` injecte le script de Google Tag Manager quand le
            // AJOUT DU 02/09/2026 : `news.google.com` manquait lui aussi.
            // Le bouton « source préférée » de Google est posé dans le pied de
            // page, donc chargé sur les 93 pages du site — et bloqué par notre
            // propre CSP à chaque fois, en silence. Exactement le même défaut
            // que celui décrit juste en dessous pour la mesure d'audience :
            // une fonctionnalité installée, jamais fonctionnelle, et rien qui
            // le signale à qui ne regarde pas la console.
            //
            // visiteur a accepté la mesure. Or `script-src` ne listait que
            // `'self'` : le navigateur refusait le script, silencieusement pour
            // qui ne regarde pas la console. Une campagne payante tournait donc
            // sans qu'aucune conversion ne remonte — on achète des clics sans
            // jamais savoir lesquels ont produit une inscription, et les
            // enchères automatiques n'ont rien pour apprendre.
            //
            // On n'ouvre que les trois domaines nécessaires, et rien d'autre :
            // le reste de la politique demeure aussi fermé qu'avant.
            // `'self'` dans frame-src : l'aperçu de la carte à intégrer
            // (/academie/integrations) encadre une page du site lui-même.
            "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.googleadservices.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://api.les-extras.fr https://www.google-analytics.com https://www.googleadservices.com https://googleads.g.doubleclick.net; frame-src 'self' https://www.youtube-nocookie.com https://td.doubleclick.net; frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests",
          },
        ],
      },
      {
        // LA VISIO : CAMÉRA, MICRO ET SERVEUR MÉDIA, SUR CES SEULES PAGES.
        //
        // L'en-tête général coupe la caméra et le micro (`camera=()`) et
        // n'autorise aucune connexion vers le serveur média : une salle de
        // visio ne pouvait donc pas s'ouvrir, en silence. On rouvre les deux
        // sur les pages qui en ont besoin, et nulle part ailleurs. Pour deux
        // règles qui posent la même clé, Next garde la dernière.
        source: '/:salle(classe|visio)/:path*',
        headers: [
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), display-capture=(self), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; media-src 'self' blob: mediastream:; connect-src 'self' https://api.les-extras.fr wss://*.livekit.cloud https://*.livekit.cloud; frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests",
          },
        ],
      },
      {
        // LES CARTES À INTÉGRER SUR UN AUTRE SITE (Intégrations externes).
        //
        // Ces pages sont faites pour être posées dans une iframe, chez
        // l'organisme : elles seules acceptent d'être encadrées par une autre
        // origine. Elles n'affichent qu'une formation publiée et un bouton.
        source: '/integration/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors *; base-uri 'self'; form-action 'self'; object-src 'none'",
          },
        ],
      },
      {
        // SOURCE DES MINI-FORMATIONS — lisible depuis une autre origine.
        //
        // Le contenu des mini-formations gratuites est écrit ici, dans le
        // dépôt, et poussé de là vers la plateforme d'apprentissage. Sans cet
        // en-tête, le navigateur refuse de lire le fichier depuis une autre
        // origine, et il faut alors recopier chaque module à la main — douze
        // copier-coller pour trois formations, et dix-huit formations sont
        // prévues.
        //
        // Ce qui est ouvert : un dossier, en LECTURE, sur des fichiers dont le
        // contenu est de toute façon destiné à être public et gratuit. Rien
        // d'autre du site ne devient lisible : la règle ne porte que sur
        // `/formations-source/`.
        source: '/formations-source/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=60' },
        ],
      },
    ];
  },
};

export default nextConfig;
