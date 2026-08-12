import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = 'lesextras_session';

/** Préfixes nécessitant une session (garde de premier niveau, peu coûteuse). */
const PROTECTED = ['/dashboard', '/marketplace', '/admin', '/welcome', '/wizard'];
/** Pages d'auth : redirigent vers le dashboard si déjà connecté. */
const AUTH_PAGES = ['/login', '/register'];

/**
 * Garde de bord légère basée sur la présence du cookie de session (la
 * vérification cryptographique complète est faite dans getSession / les layouts).
 * Évite le flash de contenu protégé et les redirections tardives.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`)) && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (AUTH_PAGES.includes(pathname) && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // Le chemin courant, pour les layouts serveur : un layout ne le connaît pas,
  // et le compte salarié en attente de rattachement a besoin de savoir sur
  // quelle page il se trouve pour décider quoi afficher.
  const entetes = new Headers(request.headers);
  entetes.set('x-chemin', pathname);
  return NextResponse.next({ request: { headers: entetes } });
}

export const config = {
  matcher: [
    /*
     * Toutes les routes sauf : API, assets Next, fichiers statiques.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
