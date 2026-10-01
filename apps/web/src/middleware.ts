import { NextResponse, type NextRequest } from 'next/server';

/**
 * Le cookie de session posé par l'API à la connexion.
 * On ne le lit pas ici (pas de secret côté middleware) : on vérifie seulement
 * sa présence pour éviter d'afficher une page protégée à un visiteur anonyme.
 */
const SESSION_COOKIE = 'lesextras_session';

/** Espaces qui exigent une session. */
const PROTECTED = ['/dashboard', '/marketplace', '/admin', '/welcome', '/wizard'];

/** Pages qui n'ont plus de sens une fois connecté. */
const AUTH_PAGES = ['/login', '/register'];

/**
 * PILOTER (pilote.toulali.fr) — TROIS ADRESSES, DEUX ESPACES.
 *
 *   /            la plateforme : elle présente les deux espaces (logo doré)
 *   /chemin      ce qu'est un chemin, et les deux chemins : association, académie
 *   /association l'espace association  (dossier app/association/)
 *   /academie    l'espace académie     (dossier app/academie/)
 *
 * Les adresses courtes historiques (`/espace`, `/connexion`, `/mon-profil`…)
 * continuent de fonctionner : elles sont réécrites vers `app/association/…`
 * sans changer ce qui s'affiche dans la barre d'adresse. Rien de ce qui a été
 * partagé ou mis en favori ne se casse.
 *
 * `/` et `/association` sont servis par le MÊME fichier : il lit l'en-tête
 * `x-chemin` posé ici pour savoir laquelle des deux pages il doit rendre.
 *
 * L'ancien domaine `association.toulali.fr` renvoie en 308 vers le nouveau.
 */
const HOTE_PILOTE = 'pilote.toulali.fr';
const HOTE_ANCIEN = 'association.toulali.fr';
const PREFIXE_ASSOCIATION = '/association';
const PREFIXE_ACADEMIE = '/academie';
/** La page qui explique ce qu'est un chemin et ouvre les deux chemins. */
const PAGE_CHOIX_CHEMIN = `${PREFIXE_ASSOCIATION}/choisir-le-chemin`;

/**
 * LES PAGES QUI NE SONT DANS AUCUN ESPACE.
 *
 * Un formulaire partagé, la vitrine d'une école en ligne, la page d'un cours,
 * le cours qu'on suit avec son lien personnel, la boutique d'une association,
 * et les médias d'une leçon. Elles s'ouvrent sans session, sans barre
 * latérale, et se servent telles quelles : ni réécriture vers un espace, ni
 * redirection vers la connexion.
 *
 * Oublier d'inscrire ici une adresse publique ne se voit pas tout de suite :
 * elle part se faire réécrire dans l'espace association et répond 404.
 */
const PUBLIQUES = ['/f', '/ecole', '/cours', '/apprendre', '/boutique', '/medias', '/classe', '/integration', '/stagiaire', '/signer-document', '/avis-commanditaire'];

/**
 * LE DOMAINE PERSONNALISÉ D'UNE ÉCOLE (formations.monsite.fr).
 *
 * Tout hôte qui n'est ni Les Extras ni Piloter est peut-être le domaine d'une
 * école : on demande à l'API à quelle école il appartient (réponse gardée cinq
 * minutes), et l'accueil du domaine sert la vitrine de cette école. Un hôte
 * inconnu de l'API retombe sur le comportement normal : rien ne casse.
 */
const HOTES_CONNUS = /(^|\.)les-extras\.(fr|com)$|^localhost$|^\d+\.\d+\.\d+\.\d+$/;
const DOMAINES_ECOLE = new Map<string, { slug: string | null; expire: number }>();

async function ecoleDuDomaine(hote: string): Promise<string | null> {
  const connu = DOMAINES_ECOLE.get(hote);
  if (connu && connu.expire > Date.now()) return connu.slug;
  const base = (process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'https://api.les-extras.fr/api').replace(/\/$/, '');
  let slug: string | null = null;
  try {
    const r = await fetch(`${base}/public/ecole/domaine/${encodeURIComponent(hote)}`, { signal: AbortSignal.timeout(3000) });
    if (r.ok) slug = ((await r.json()) as { slug?: string }).slug ?? null;
  } catch {
    slug = null;
  }
  DOMAINES_ECOLE.set(hote, { slug, expire: Date.now() + 5 * 60_000 });
  return slug;
}

/** L'administration de Piloter : une seule adresse, sur le domaine de Piloter. */
const ADMINISTRATION = '/administration';

/**
 * DEUX PRODUITS, DEUX DÉPLOIEMENTS (séparation de Pilote, étape 3).
 *
 * Le même code sert les deux sites. Posée sur une application Coolify,
 * `PRODUIT` dit lequel elle sert : `pilote` n'accepte que Pilote et les
 * domaines d'école, `les-extras` que Les Extras. Une requête arrivée sur la
 * mauvaise application (domaine encore rattaché à l'autre, DNS en cours de
 * bascule) est renvoyée vers le bon site au lieu d'être servie ici. Sans la
 * variable, rien ne change : l'application sert les deux, comme avant. Les
 * pages statiques et `/api` ne passent pas par ce filtre (matcher) : elles
 * sont identiques des deux côtés.
 */
const PRODUIT = (process.env.PRODUIT ?? '').trim().toLowerCase();
const HOTES_LES_EXTRAS = /(^|\.)les-extras\.(fr|com)$/;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hote = (request.headers.get('host') ?? '').split(':')[0].toLowerCase();

  // L'hôte est le bon, c'est l'application qui ne l'est pas : on ne redirige
  // pas sur soi-même (boucle), on répond 421 « requête mal aiguillée », que le
  // routeur ne met pas en cache.
  if (PRODUIT === 'pilote' && HOTES_LES_EXTRAS.test(hote)) {
    return new NextResponse('Ce site est servi par l’application Les Extras.', { status: 421 });
  }
  if (PRODUIT === 'les-extras' && (hote === HOTE_PILOTE || hote === HOTE_ANCIEN)) {
    return new NextResponse('Ce site est servi par l’application Pilote.', { status: 421 });
  }

  // Le domaine personnalisé d'une école : son accueil est la vitrine de l'école.
  if (hote && hote !== HOTE_PILOTE && hote !== HOTE_ANCIEN && !HOTES_CONNUS.test(hote)) {
    const slug = /\.[a-z0-9]+$/i.test(pathname) ? null : await ecoleDuDomaine(hote);
    if (slug) {
      if (PUBLIQUES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return NextResponse.next();
      const url = request.nextUrl.clone();
      url.pathname = pathname === '/' ? `/ecole/${slug}` : `/ecole/${slug}${pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // L'ancienne adresse : on redirige tout, en gardant le chemin et la requête.
  if (hote === HOTE_ANCIEN) {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    url.host = HOTE_PILOTE;
    url.port = '';
    return NextResponse.redirect(url, 308);
  }

  if (hote === HOTE_PILOTE) {
    // LE MANIFESTE D'INSTALLATION. Le même code sert deux sites : sans cette
    // réécriture, le téléphone proposerait d'installer « Les Extras » à
    // quelqu'un qui pilote son association. Un fichier par site, servi tel quel.
    if (pathname === '/manifest.webmanifest' || pathname === '/manifest.json') {
      const url = request.nextUrl.clone();
      url.pathname = '/pilote/manifeste.webmanifest';
      return NextResponse.rewrite(url);
    }

    // ROBOTS ET PLAN DU SITE : les siens. Les fichiers partagés annonçaient
    // les-extras.fr/sitemap.xml, donc aucune page de Pilote aux moteurs.
    if (pathname === '/robots.txt') {
      const url = request.nextUrl.clone();
      url.pathname = '/pilote/robots.txt';
      return NextResponse.rewrite(url);
    }
    if (pathname === '/sitemap.xml') {
      const url = request.nextUrl.clone();
      url.pathname = '/plan-pilote';
      return NextResponse.rewrite(url);
    }

    // Fichiers partagés entre les sites (icônes, modèles…).
    if (/\.[a-z0-9]+$/i.test(pathname)) return NextResponse.next();

    // Les pages publiques hors espace : un formulaire partagé, la vitrine d'une
    // école, la page d'un cours, et le cours qu'on suit avec son lien personnel.
    if (PUBLIQUES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return NextResponse.next();

    // L'administration : hors des deux espaces, et fermée sans session. Le rôle
    // ADMIN est vérifié par la page ET par l'API — jamais par le navigateur.
    if (pathname === ADMINISTRATION || pathname.startsWith(`${ADMINISTRATION}/`)) {
      if (!request.cookies.get(SESSION_COOKIE)?.value) {
        const url = request.nextUrl.clone();
        url.pathname = '/connexion';
        url.search = '';
        url.searchParams.set('next', pathname);
        return NextResponse.redirect(url);
      }
      const entetes = new Headers(request.headers);
      entetes.set('x-chemin', pathname);
      return NextResponse.next({ request: { headers: entetes } });
    }

    // L'espace académie est servi tel quel : son dossier porte déjà le préfixe.
    if (pathname === PREFIXE_ACADEMIE || pathname.startsWith(`${PREFIXE_ACADEMIE}/`)) {
      const espaceProtege =
        pathname === `${PREFIXE_ACADEMIE}/espace` ||
        pathname.startsWith(`${PREFIXE_ACADEMIE}/espace/`) ||
        pathname === `${PREFIXE_ACADEMIE}/mon-academie` ||
        pathname.startsWith(`${PREFIXE_ACADEMIE}/mon-academie/`);
      if (espaceProtege && !request.cookies.get(SESSION_COOKIE)?.value) {
        const url = request.nextUrl.clone();
        url.pathname = `${PREFIXE_ACADEMIE}/connexion`;
        url.search = '';
        url.searchParams.set('next', pathname);
        return NextResponse.redirect(url);
      }
      const entetes = new Headers(request.headers);
      entetes.set('x-chemin', pathname);
      return NextResponse.next({ request: { headers: entetes } });
    }

    // La page de choix ne s'ouvre que par `/chemin` : son adresse interne redirige.
    if (pathname === PAGE_CHOIX_CHEMIN) {
      const url = request.nextUrl.clone();
      url.pathname = '/chemin';
      return NextResponse.redirect(url, 308);
    }

    // `/chemin` n'est plus le chemin de l'association : c'est le choix entre les deux.
    if (pathname === '/chemin') {
      const url = request.nextUrl.clone();
      url.pathname = PAGE_CHOIX_CHEMIN;
      const entetes = new Headers(request.headers);
      entetes.set('x-chemin', pathname);
      return NextResponse.rewrite(url, { request: { headers: entetes } });
    }

    // L'espace association est servi tel quel : son dossier porte déjà le préfixe.
    if (pathname === PREFIXE_ASSOCIATION || pathname.startsWith(`${PREFIXE_ASSOCIATION}/`)) {
      const suite = pathname.slice(PREFIXE_ASSOCIATION.length);
      const espaceProtege = suite === '/espace' || suite.startsWith('/espace/');
      if (espaceProtege && !request.cookies.get(SESSION_COOKIE)?.value) {
        const url = request.nextUrl.clone();
        url.pathname = '/connexion';
        url.search = '';
        url.searchParams.set('next', pathname);
        return NextResponse.redirect(url);
      }
      const entetes = new Headers(request.headers);
      entetes.set('x-chemin', pathname);
      return NextResponse.next({ request: { headers: entetes } });
    }

    // L'espace connecté exige une session : sinon, la connexion, en gardant la page demandée.
    if ((pathname === '/espace' || pathname.startsWith('/espace/')) && !request.cookies.get(SESSION_COOKIE)?.value) {
      const url = request.nextUrl.clone();
      url.pathname = '/connexion';
      url.search = '';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }

    const url = request.nextUrl.clone();
    url.pathname = `${PREFIXE_ASSOCIATION}${pathname === '/' ? '' : pathname}`;
    const entetes = new Headers(request.headers);
    entetes.set('x-chemin', pathname);
    return NextResponse.rewrite(url, { request: { headers: entetes } });
  }

  // Une adresse « /association/… » ou « /academie/… » ouverte sur les-extras.fr
  // renvoie vers son vrai domaine : il n'existe qu'une seule adresse par page.
  if (pathname === PREFIXE_ASSOCIATION || pathname.startsWith(`${PREFIXE_ASSOCIATION}/`)) {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    url.host = HOTE_PILOTE;
    url.port = '';
    return NextResponse.redirect(url, 308);
  }
  if (pathname === PREFIXE_ACADEMIE || pathname.startsWith(`${PREFIXE_ACADEMIE}/`)) {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    url.host = HOTE_PILOTE;
    url.port = '';
    return NextResponse.redirect(url, 308);
  }
  // Ces pages n'ont qu'une adresse : celle de Piloter.
  if (
    pathname === ADMINISTRATION ||
    pathname.startsWith(`${ADMINISTRATION}/`) ||
    PUBLIQUES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  ) {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    url.host = HOTE_PILOTE;
    url.port = '';
    return NextResponse.redirect(url, 308);
  }

  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  // Espace protégé sans session : vers la connexion, en gardant la destination.
  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`)) && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    // La requête suit le chemin (01/10/2026) : un lien « Adapter avec LEX »
    // d'une ressource ouvre LEX déjà réglé, y compris après la connexion.
    const suite = pathname + request.nextUrl.search;
    url.search = '';
    url.searchParams.set('next', suite);
    return NextResponse.redirect(url);
  }

  // Déjà connecté : les pages de connexion renvoient au tableau de bord.
  if (AUTH_PAGES.includes(pathname) && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // Le chemin courant, lisible par les layouts serveur.
  const entetes = new Headers(request.headers);
  entetes.set('x-chemin', pathname);
  return NextResponse.next({ request: { headers: entetes } });
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
