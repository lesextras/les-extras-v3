import 'server-only';
import { cookies } from 'next/headers';
import { jwtVerify, type JWTPayload } from 'jose';
import type { Session, SessionUser, SessionAccount } from './types';

/** Nom du cookie de session (JWT signé avec SESSION_SECRET). */
export const SESSION_COOKIE = 'lesextras_session';
/** Cookie portant l'id du compte actif côté web. */
export const ACTIVE_ACCOUNT_COOKIE = 'lesextras_account';

/**
 * Secrets candidats pour vérifier le JWT de session. Le token peut être émis
 * côté web (SESSION_SECRET) ou provenir directement de l'API (JWT_SECRET) :
 * on tente les deux pour rester tolérant à l'intégration.
 */
function getSecretKeys(): Uint8Array[] {
  const secrets = [process.env.SESSION_SECRET, process.env.JWT_SECRET].filter(
    (s): s is string => !!s,
  );
  if (secrets.length === 0) {
    throw new Error('SESSION_SECRET / JWT_SECRET manquant : impossible de vérifier la session.');
  }
  const encoder = new TextEncoder();
  return secrets.map((s) => encoder.encode(s));
}

async function verifyWithAnyKey(token: string): Promise<SessionClaims | null> {
  for (const key of getSecretKeys()) {
    try {
      const { payload } = await jwtVerify<SessionClaims>(token, key);
      return payload;
    } catch {
      // essaie le secret suivant
    }
  }
  return null;
}

interface SessionClaims extends JWTPayload {
  sub?: string;
  id?: string;
  email?: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  role?: SessionUser['role'];
  status?: SessionUser['status'];
  onboardingStep?: number;
  account?: SessionAccount | null;
  activeAccount?: SessionAccount | null;
  accounts?: SessionAccount[];
}

/** Déduit prénom/nom depuis un nom complet si non fournis séparément. */
function splitName(full?: string | null): { firstName: string | null; lastName: string | null } {
  if (!full) return { firstName: null, lastName: null };
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0]!, lastName: null };
  return { firstName: parts[0]!, lastName: parts.slice(1).join(' ') };
}

/**
 * Lit et vérifie le cookie de session. Retourne la session décodée
 * (utilisateur + token brut + comptes) ou `null` si absent/invalide/expiré.
 *
 * À utiliser dans les Server Components, layouts de garde et Route Handlers.
 */
export async function getSession(): Promise<Session | null> {
  const store = cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const payload = await verifyWithAnyKey(token);
    if (!payload) return null;

    const id = payload.id ?? payload.sub;
    const email = payload.email;
    if (!id || !email) return null;

    const derived = splitName(payload.name);
    const user: SessionUser = {
      id,
      email,
      name: payload.name ?? null,
      firstName: payload.firstName ?? derived.firstName,
      lastName: payload.lastName ?? derived.lastName,
      avatarUrl: payload.avatarUrl ?? null,
      role: payload.role ?? 'USER',
      status: payload.status,
      onboardingStep: payload.onboardingStep ?? 0,
    };

    // Compte actif : priorité au cookie dédié, sinon claim du token.
    const cookieAccountId = store.get(ACTIVE_ACCOUNT_COOKIE)?.value;
    const accounts = payload.accounts ?? [];
    const active =
      (cookieAccountId && accounts.find((a) => a.id === cookieAccountId)) ||
      payload.account ||
      payload.activeAccount ||
      accounts[0] ||
      null;

    // `account` est requis par les consommateurs (Web-Marketplace). En absence
    // de compte (cas limite : admin sans tenant), on fournit un placeholder sûr.
    const account: SessionAccount =
      active ?? { id: '', name: '—', type: 'FREELANCE', role: 'MEMBER' };

    return { user, token, account, activeAccount: active, accounts };
  } catch {
    return null;
  }
}

/** Raccourci : retourne l'utilisateur courant ou null. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  return session?.user ?? null;
}

/** Vrai si l'utilisateur doit encore finir son onboarding. */
export function needsOnboarding(user: SessionUser | null | undefined): boolean {
  return !!user && user.onboardingStep < ONBOARDING_TOTAL_STEPS;
}

/** Nombre total d'étapes du wizard d'onboarding. */
export const ONBOARDING_TOTAL_STEPS = 3;
