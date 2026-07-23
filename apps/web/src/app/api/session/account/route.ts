import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ACTIVE_ACCOUNT_COOKIE, getSession } from '@/lib/session';

/**
 * Change le compte actif (multi-comptes). Vérifie que l'utilisateur possède
 * bien une adhésion au compte demandé avant de poser le cookie.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'Non authentifié.' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { accountId?: string } | null;
  const accountId = body?.accountId;
  if (!accountId) {
    return NextResponse.json({ message: 'accountId manquant.' }, { status: 400 });
  }

  const allowed = (session.accounts ?? []).some((a) => a.id === accountId);
  if (!allowed) {
    return NextResponse.json({ message: 'Compte non autorisé.' }, { status: 403 });
  }

  cookies().set(ACTIVE_ACCOUNT_COOKIE, accountId, {
    httpOnly: false,
    sameSite: 'lax',
    secure: (request.headers.get('x-forwarded-proto') ?? '') === 'https',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ ok: true });
}
