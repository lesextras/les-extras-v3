/**
 * Proxy same-origin : le navigateur appelle /api/proxy/<path> (cookies envoyés
 * automatiquement, même origine), et ce handler serveur lit le cookie de session
 * httpOnly + le compte actif, puis transmet la requête à l'API NestJS avec
 * Authorization: Bearer et x-account-id. Résout l'auth des mutations côté client
 * sans exposer le JWT au JavaScript.
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, ACTIVE_ACCOUNT_COOKIE } from '@/lib/session';
import { academieConnectee } from '../../../academie/_session';
import { associationConnectee } from '../../../association/_session';

export const dynamic = 'force-dynamic';

function apiBase(): string {
  return (
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:3001/api'
  );
}

/**
 * SUR PILOTER, LE COMPTE EST CELUI DE LA PAGE, PAS CELUI DU COOKIE LES EXTRAS.
 *
 * ⚠ Défaut trouvé le 24/09/2026 : « Créer mon premier formulaire » créait le
 * formulaire sur le compte actif de Les Extras (l'établissement ADéPA), puis la
 * page, rendue au nom de l'académie, répondait « ce formulaire n'existe pas ».
 * Même chose pour tout composant qui appelle le relais sans en-tête, ou avec
 * un `pilote_espace` qui désigne l'autre espace (association lue depuis
 * l'académie). Le relais choisit donc le compte exactement comme la page :
 * une page sous /academie parle au nom de l'académie, toute autre page de
 * pilote.* au nom de l'association. Les pages publiques (école, formulaire
 * public, boutique…) gardent le comportement d'avant.
 */
const PUBLIQUES_PILOTE = ['/f', '/ecole', '/cours', '/apprendre', '/boutique', '/medias', '/classe', '/integration', '/connexion', '/inscription'];

async function comptePilote(req: NextRequest): Promise<string | null> {
  const hote = (req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? '').split(':')[0].toLowerCase();
  if (!hote.startsWith('pilote.')) return null;
  const referer = req.headers.get('referer');
  if (!referer) return null;
  let chemin: string;
  try {
    chemin = new URL(referer).pathname;
  } catch {
    return null;
  }
  if (PUBLIQUES_PILOTE.some((p) => chemin === p || chemin.startsWith(`${p}/`))) return null;
  try {
    if (chemin === '/academie' || chemin.startsWith('/academie/')) return (await academieConnectee())?.id ?? null;
    return (await associationConnectee())?.id ?? null;
  } catch {
    return null;
  }
}

async function forward(req: NextRequest, path: string[]): Promise<Response> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const cookieAccount = store.get(ACTIVE_ACCOUNT_COOKIE)?.value;

  const search = req.nextUrl.search ?? '';
  const target = `${apiBase()}/${path.join('/')}${search}`;

  // On relaie l'Accept du navigateur : un téléchargement de PDF ne demande pas
  // du JSON. Le forcer casserait la négociation de contenu.
  const headers: Record<string, string> = {
    Accept: req.headers.get('accept') ?? 'application/json',
  };
  const ct = req.headers.get('content-type');
  // Pour un envoi multipart, on ne recopie PAS le Content-Type tel quel :
  // il porte une frontière (boundary) qui doit rester cohérente avec le corps.
  // Comme on retransmet le corps octet pour octet, la recopie est correcte.
  if (ct) headers['Content-Type'] = ct;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const headerAccount = req.headers.get('x-account-id');
  const accountId = (await comptePilote(req)) || headerAccount || cookieAccount;
  if (accountId) headers['x-account-id'] = accountId;

  // L'IP DU VISITEUR, SANS QUOI TOUT LE MONDE PARTAGE LE MÊME SEAU.
  //
  // Ce handler s'exécute sur le serveur Next : vue de l'API, chaque requête
  // vient de la même machine. Les limiteurs de débit — création de compte,
  // renvoi de code, mot de passe oublié, génération LEX — comptaient donc
  // ensemble les appels de TOUS les utilisateurs. Conséquences symétriques et
  // toutes deux mauvaises : l'établissement qui inscrit son équipe se fait
  // bloquer par l'activité des autres, et une attaque distribuée passe sous
  // le seuil en se diluant. On relaie la chaîne telle que le proxy amont l'a
  // établie ; on ne fabrique jamais d'IP nous-mêmes.
  for (const nom of ['x-forwarded-for', 'x-real-ip']) {
    const valeur = req.headers.get(nom);
    if (valeur) headers[nom] = valeur;
  }

  const method = req.method.toUpperCase();
  const hasBody = !['GET', 'HEAD'].includes(method);
  // arrayBuffer et non text : un dépôt de fichier est binaire, et le décoder
  // en UTF-8 corromprait irrémédiablement le contenu.
  const raw = hasBody ? await req.arrayBuffer() : undefined;
  const body = raw && raw.byteLength ? Buffer.from(raw) : undefined;

  let res: Response;
  try {
    res = await fetch(target, {
      method,
      headers,
      body,
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      { message: "Service indisponible (API injoignable)." },
      { status: 502 },
    );
  }

  // Idem au retour : un PDF ou une image doit traverser sans transformation.
  const payload = await res.arrayBuffer();
  const outHeaders: Record<string, string> = {
    'content-type': res.headers.get('content-type') ?? 'application/json',
  };
  // Entêtes utiles au téléchargement de fichiers, relayés tels quels.
  for (const nom of ['content-disposition', 'cache-control', 'x-content-type-options']) {
    const valeur = res.headers.get(nom);
    if (valeur) outHeaders[nom] = valeur;
  }
  return new NextResponse(payload, { status: res.status, headers: outHeaders });
}

type Ctx = { params: Promise<{ path: string[] }> };
export const GET = async (req: NextRequest, { params }: Ctx) => forward(req, (await params).path);
export const POST = async (req: NextRequest, { params }: Ctx) => forward(req, (await params).path);
export const PUT = async (req: NextRequest, { params }: Ctx) => forward(req, (await params).path);
export const PATCH = async (req: NextRequest, { params }: Ctx) => forward(req, (await params).path);
export const DELETE = async (req: NextRequest, { params }: Ctx) => forward(req, (await params).path);
