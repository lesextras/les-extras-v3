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
 * PILOTER (pilote.toulali.fr) — DEUX ESPACES SOUS UN SEUL DOMAINE.
 *
 * Le même déploiement sert plusieurs sites. Sur ce domaine :
 *  - la racine est l'espace association — `/chemin` devient `/association/chemin`
 *    sans que l'adresse change dans le navigateur ;
 *  - `/academie/…` est l'espace académie, servi tel quel depuis `app/academie/`.
 *
 * L'ancien domaine `association.toulali.fr` renvoie en 308 vers le nouveau,
 * page par page : rien de ce qui est indexé ou partagé ne se casse.
 */
const HOTE_PILOTE = 'pilote.toulali.fr';
const HOTE_ANCIEN = 'association.toulali.fr';
const PREFIXE_ASSOCIATION = '/association';
const PREFIXE_ACADEMIE = '/academie';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hote = (request.headers.get('host') ?? '').split(':')[0].toLowerCase();

  // L'ancienne adresse : on redirige tout, en gardant le chemin et la requête.
  if (hote === HOTE_ANCIEN) {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    url.host = HOTE_PILOTE;
    url.port = '';
    return NextResponse.redirect(url, 308);
  }

  if (hote === HOTE_PILOTE) {
    // Fichiers partagés entre les sites (manifeste, robots, plan du site…).
    if (/\.[a-z0-9]+$/i.test(pathname)) return NextResponse.next();

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

    // Adresse déjà préfixée `/association` : on la ramène à sa forme courte.
    if (pathname === PREFIXE_ASSOCIATION || pathname.startsWith(`${PREFIXE_ASSOCIATION}/`)) {
      const url = request.nextUrl.clone();
      url.pathname = pathname.slice(PREFIXE_ASSOCIATION.length) || '/';
      return NextResponse.redirect(url, 308);
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
    url.pathname = pathname.slice(PREFIXE_ASSOCIATION.length) || '/';
    return NextResponse.redirect(url, 308);
  }
  if (pathname === PREFIXE_ACADEMIE || pathname.startsWith(`${PREFIXE_ACADEMIE}/`)) {
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
    url.searchParams.set('next', pathname);
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
