'use client';

import { getPublicApiBaseUrl } from './api';
import type { LoginValues, RegisterValues } from './validation';
import type { SessionAccount } from './types';
import { sourceComplete } from './source';
import { signalerInscription } from './conversion';

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
    // NestJS renvoie soit une chaîne, soit un tableau de messages de
    // validation. L'ancienne version faisait String() AVANT le test
    // Array.isArray : le tableau devenait une chaîne à virgules, le test
    // échouait toujours, et l'utilisateur recevait la liste brute des
    // règles de validation, en anglais. On teste le tableau d'abord.
    const brut = data && typeof data === 'object' && 'message' in data ? data.message : null;
    const message = Array.isArray(brut)
      ? String(brut[0])
      : typeof brut === 'string' && brut.trim()
        ? brut
        : 'Une erreur est survenue. Réessayez.';
    throw new Error(message);
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

/**
 * Choix du nouveau mot de passe après avoir cliqué le lien reçu par e-mail.
 *
 * On enchaîne sur la session : quelqu'un qui vient de prouver qu'il relève
 * cette adresse ET de choisir un mot de passe n'a aucune raison de le retaper
 * dans la foulée sur l'écran de connexion.
 */
export async function reinitialiserMotDePasse(
  token: string,
  password: string,
): Promise<AuthResult> {
  const result = await callApi<AuthResult>('/auth/reset-password', { token, password });
  const { token: jeton, accountId } = extractAuth(result);
  if (jeton) await persistSession(jeton, accountId);
  return result;
}

export async function register(values: RegisterValues): Promise<AuthResult> {
  // Origine de la visite, mémorisée à l'arrivée sur le site : c'est ici
  // qu'elle quitte le navigateur, et nulle part ailleurs.
  const origine = sourceComplete();
  const payload = {
    accountType: values.accountType,
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    // Un intervenant n'a pas de structure : le compte prend alors son nom.
    organizationName:
      values.accountType === 'ESTABLISHMENT' ? values.organizationName?.trim() : undefined,
    email: values.email,
    password: values.password,
    source: origine.source,
    sourceMedium: origine.medium,
    sourceCampaign: origine.campaign,
    sourceLanding: origine.landing,
    parrain: origine.parrain,
  };
  const result = await callApi<AuthResult>('/auth/register', payload);
  const { token, accountId } = extractAuth(result);
  // Selon la config API, l'inscription peut ou non renvoyer un token directement.
  if (token) {
    await persistSession(token, accountId);
  }
  // Signalé APRÈS la réussite : une conversion ne se compte pas sur une
  // tentative. Sans consentement ou sans identifiant Ads, l'appel ne fait rien.
  signalerInscription(values.accountType);
  return result;
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/session', { method: 'DELETE' });
}
