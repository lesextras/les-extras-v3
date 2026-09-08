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

    // La page publique d'un formulaire : hors espace, sans session, telle quelle.
    if (pathname === '/f' || pathname.startsWith('/f/')) return NextResponse.next();

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
  // Un formulaire partagé n'a qu'une adresse : celle de Piloter.
  if (pathname === '/f' || pathname.startsWith('/f/')) {
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
