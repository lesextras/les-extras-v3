'use client';

import { getPublicApiBaseUrl } from './api';
import type { LoginValues, RegisterValues } from './validation';
import type { SessionAccount } from './types';

/**
 * Fonctions d'authentification côté navigateur : appellent l'API NestJS, puis
 * posent le cookie de session httpOnly via la route interne /api/auth/session.
 */

export interface AuthResult {
  /** L'API renvoie `accessToken` ; on tolère aussi `token` par sécurité. */
  accessToken?: string;
  token?: string;
  activeAccount?: SessionAccount | null;
  account?: SessionAccount | null;
  user?: {
    id: string;
    email: string;
    role: string;
    onboardingStep?: number;
    memberships?: Array<{ account?: { id: string } }>;
  };
}

/** Extrait le token et le compte actif d'une réponse d'auth, quel que soit le nom des champs. */
function extractAuth(result: AuthResult): { token?: string; accountId?: string } {
  const token = result.accessToken ?? result.token;
  const accountId =
    result.activeAccount?.id ??
    result.account?.id ??
    result.user?.memberships?.[0]?.account?.id;
  return { token, accountId };
}

async function callApi<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${getPublicApiBaseUrl()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && 'message' in data && String(data.message)) ||
      'Une erreur est survenue. Réessayez.';
    throw new Error(Array.isArray(message) ? message[0] : message);
  }
  return data as T;
}

/** Pose le cookie de session à partir du token retourné par l'API. */
async function persistSession(token: string, accountId?: string | null): Promise<void> {
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, accountId: accountId ?? undefined }),
  });
  if (!res.ok) throw new Error('La session n\u2019a pas pu être établie.');
}

export async function login(values: LoginValues): Promise<AuthResult> {
  const result = await callApi<AuthResult>('/auth/login', values);
  const { token, accountId } = extractAuth(result);
  if (!token) throw new Error('Connexion impossible : jeton manquant.');
  await persistSession(token, accountId);
  return result;
}

export async function register(values: RegisterValues): Promise<AuthResult> {
  const payload = {
    accountType: values.accountType,
    name: values.name,
    email: values.email,
    password: values.password,
  };
  const result = await callApi<AuthResult>('/auth/register', payload);
  const { token, accountId } = extractAuth(result);
  // Selon la config API, l'inscription peut ou non renvoyer un token directement.
  if (token) {
    await persistSession(token, accountId);
  }
  return result;
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/session', { method: 'DELETE' });
}
