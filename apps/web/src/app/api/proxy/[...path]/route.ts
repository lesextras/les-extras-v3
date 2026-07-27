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

export const dynamic = 'force-dynamic';

function apiBase(): string {
  return (
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:3001/api'
  );
}

async function forward(req: NextRequest, path: string[]): Promise<Response> {
  const store = cookies();
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
  const accountId = headerAccount || cookieAccount;
  if (accountId) headers['x-account-id'] = accountId;

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

type Ctx = { params: { path: string[] } };
export const GET = (req: NextRequest, { params }: Ctx) => forward(req, params.path);
export const POST = (req: NextRequest, { params }: Ctx) => forward(req, params.path);
export const PUT = (req: NextRequest, { params }: Ctx) => forward(req, params.path);
export const PATCH = (req: NextRequest, { params }: Ctx) => forward(req, params.path);
export const DELETE = (req: NextRequest, { params }: Ctx) => forward(req, params.path);
