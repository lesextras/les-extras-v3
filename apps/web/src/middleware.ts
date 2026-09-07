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
 * PILOTER MON ASSOCIATION (association.toulali.fr).
 *
 * Le même déploiement sert deux sites. Sur ce domaine, tout le site est le
 * groupe de routes `app/association/` : « /chemin » devient « /association/chemin »
 * sans que l'adresse change dans le navigateur. Dans l'autre sens, une URL
 * « /association/… » ouverte sur les-extras.fr renvoie vers son vrai domaine,
 * pour qu'il n'existe qu'une seule adresse par page.
 */
const HOTE_ASSOCIATION = 'association.toulali.fr';
const PREFIXE_ASSOCIATION = '/association';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hote = (request.headers.get('host') ?? '').split(':')[0].toLowerCase();

  if (hote === HOTE_ASSOCIATION) {
    // Fichiers partagés entre les deux sites (manifeste, robots, plan du site…).
    if (/\.[a-z0-9]+$/i.test(pathname)) return NextResponse.next();
    if (pathname === PREFIXE_ASSOCIATION || pathname.startsWith(`${PREFIXE_ASSOCIATION}/`)) {
      // Adresse déjà préfixée : on la ramène à sa forme courte.
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

  if (pathname === PREFIXE_ASSOCIATION || pathname.startsWith(`${PREFIXE_ASSOCIATION}/`)) {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    url.host = HOTE_ASSOCIATION;
    url.port = '';
    url.pathname = pathname.slice(PREFIXE_ASSOCIATION.length) || '/';
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
