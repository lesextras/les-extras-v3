import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, ACTIVE_ACCOUNT_COOKIE } from '@/lib/session';

/**
 * Pose le cookie de session (httpOnly) à partir d'un token JWT émis par l'API.
 * Appelé par les formulaires de connexion/inscription après authentification.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { token?: string; accountId?: string }
    | null;

  if (!body?.token) {
    return NextResponse.json({ message: 'Token manquant.' }, { status: 400 });
  }

  const store = await cookies();
  const maxAge = 60 * 60 * 24 * 7; // 7 jours
  // Le drapeau Secure ne dépend PAS du seul en-tête du proxy. `x-forwarded-proto`
  // est posé par Traefik ; s'il manque — reconfiguration, appel interne,
  // en-tête filtré — le cookie de session repartait en clair, autorisé à
  // voyager sur une connexion HTTP. En production, il est toujours Secure ; en
  // développement local (http://localhost), l'en-tête décide comme avant.
  const secure =
    process.env.NODE_ENV === 'production' ||
    (request.headers.get('x-forwarded-proto') ?? '') === 'https';

  store.set(SESSION_COOKIE, body.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge,
  });

  if (body.accountId) {
    store.set(ACTIVE_ACCOUNT_COOKIE, body.accountId, {
      httpOnly: false,
      sameSite: 'lax',
      secure,
      path: '/',
      maxAge,
    });
  }

  return NextResponse.json({ ok: true });
}

/** Déconnexion : supprime les cookies de session. */
export async function DELETE() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(ACTIVE_ACCOUNT_COOKIE);
  return NextResponse.json({ ok: true });
}
