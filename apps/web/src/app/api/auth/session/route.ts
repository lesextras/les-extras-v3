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

  const store = cookies();
  const maxAge = 60 * 60 * 24 * 7; // 7 jours
  const secure = (request.headers.get('x-forwarded-proto') ?? '') === 'https';

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
  const store = cookies();
  store.delete(SESSION_COOKIE);
  store.delete(ACTIVE_ACCOUNT_COOKIE);
  return NextResponse.json({ ok: true });
}
