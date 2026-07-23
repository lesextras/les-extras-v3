'use client';

import { getPublicApiBaseUrl } from './api';
import type { LoginValues, RegisterValues } from './validation';
import type { SessionAccount } from './types';

/**
 * Fonctions d'authentification côté navigateur : appellent l'API NestJS, puis
 * posent le cookie de session httpOnly via la route interne /api/auth/session.
 */

export interface AuthResult {
  token: string;
  activeAccount?: SessionAccount | null;
  user?: { id: string; email: string; role: string; onboardingStep?: number };
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
  await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, accountId: accountId ?? undefined }),
  });
}

export async function login(values: LoginValues): Promise<AuthResult> {
  const result = await callApi<AuthResult>('/auth/login', values);
  await persistSession(result.token, result.activeAccount?.id);
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
  // Selon la config API, l'inscription peut ou non renvoyer un token directement.
  if (result?.token) {
    await persistSession(result.token, result.activeAccount?.id);
  }
  return result;
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/session', { method: 'DELETE' });
}
