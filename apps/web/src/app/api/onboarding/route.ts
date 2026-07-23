import { NextResponse } from 'next/server';
import { getSession, ONBOARDING_TOTAL_STEPS } from '@/lib/session';
import { apiRequest, ApiError } from '@/lib/api';

/**
 * Finalise (ou fait progresser) l'onboarding. Transmet les données de profil à
 * l'API NestJS avec le token + le compte actif. Tolérant si l'endpoint n'existe
 * pas encore côté API (renvoie ok pour ne pas bloquer le parcours en dev).
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'Non authentifié.' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    step?: number;
    profile?: Record<string, unknown>;
  };
  const step = body.step ?? ONBOARDING_TOTAL_STEPS;

  try {
    await apiRequest('/users/me/onboarding', {
      method: 'PATCH',
      token: session.token,
      accountId: session.activeAccount?.id ?? null,
      body: { onboardingStep: step, ...(body.profile ?? {}) },
    });
    return NextResponse.json({ ok: true, step });
  } catch (err) {
    // En dev, l'endpoint API peut ne pas être prêt : on ne bloque pas le parcours.
    if (err instanceof ApiError && err.status === 404) {
      return NextResponse.json({ ok: true, step, warning: 'API onboarding indisponible.' });
    }
    const message = err instanceof Error ? err.message : 'Échec de la mise à jour.';
    return NextResponse.json({ message }, { status: 502 });
  }
}
