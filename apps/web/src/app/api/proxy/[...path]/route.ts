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

  const headers: Record<string, string> = { Accept: 'application/json' };
  const ct = req.headers.get('content-type');
  if (ct) headers['Content-Type'] = ct;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const headerAccount = req.headers.get('x-account-id');
  const accountId = headerAccount || cookieAccount;
  if (accountId) headers['x-account-id'] = accountId;

  const method = req.method.toUpperCase();
  const hasBody = !['GET', 'HEAD'].includes(method);
  const body = hasBody ? await req.text() : undefined;

  let res: Response;
  try {
    res = await fetch(target, {
      method,
      headers,
      body: body && body.length ? body : undefined,
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      { message: "Service indisponible (API injoignable)." },
      { status: 502 },
    );
  }

  const payload = await res.text();
  return new NextResponse(payload, {
    status: res.status,
    headers: {
      'content-type': res.headers.get('content-type') ?? 'application/json',
    },
  });
}

type Ctx = { params: { path: string[] } };
export const GET = (req: NextRequest, { params }: Ctx) => forward(req, params.path);
export const POST = (req: NextRequest, { params }: Ctx) => forward(req, params.path);
export const PUT = (req: NextRequest, { params }: Ctx) => forward(req, params.path);
export const PATCH = (req: NextRequest, { params }: Ctx) => forward(req, params.path);
export const DELETE = (req: NextRequest, { params }: Ctx) => forward(req, params.path);
