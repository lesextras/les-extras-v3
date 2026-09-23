import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * LA SESSION D'UN APPRENANT.
 *
 * Un apprenant n'est pas un utilisateur de la plateforme : il n'a ni compte
 * Piloter ni rôle dans une académie. Sa session est donc un jeton à part,
 * signé avec le secret de l'API, qui ne dit que trois choses : quel compte
 * apprenant, dans quelle académie, et à quelle version du mot de passe.
 *
 * ⚠ LA VERSION FAIT TOMBER LES ANCIENNES SESSIONS. Changer de mot de passe
 * incrémente `versionSession` : un jeton émis avant ne passe plus. C'est ce
 * qu'on attend quand quelqu'un change son mot de passe parce qu'il le croit
 * connu d'un autre.
 */

export interface SessionApprenant {
  /** Identifiant du compte apprenant. */
  c: string;
  /** L'académie (Account.id). */
  a: string;
  /** La version du mot de passe au moment de la connexion. */
  v: number;
  /** Expiration, en secondes depuis l'époque. */
  e: number;
}

/** Trente jours : on reste connecté comme sur n'importe quelle école en ligne. */
export const DUREE_SESSION_APPRENANT = 30 * 24 * 3600;

function secret(): string {
  const s = process.env.JWT_SECRET ?? '';
  // Le secret est obligatoire au démarrage de l'API (env.validation.ts) ; on
  // dérive tout de même une clé propre à cet usage, pour qu'un jeton apprenant
  // ne puisse jamais être rejoué comme un jeton de connexion Piloter.
  return createHash('sha256').update(`apprenant:${s}`).digest('hex');
}

function b64(donnee: string | Buffer): string {
  return Buffer.from(donnee).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function signer(partie: string): string {
  return b64(createHmac('sha256', secret()).update(partie).digest());
}

export function emettreSession(compteId: string, accountId: string, version: number): string {
  const charge: SessionApprenant = {
    c: compteId,
    a: accountId,
    v: version,
    e: Math.floor(Date.now() / 1000) + DUREE_SESSION_APPRENANT,
  };
  const partie = b64(JSON.stringify(charge));
  return `${partie}.${signer(partie)}`;
}

/** Le contenu d'un jeton valide, ou `null` : jamais d'exception ici. */
export function lireSession(jeton: string | undefined | null): SessionApprenant | null {
  if (!jeton || typeof jeton !== 'string') return null;
  const [partie, sig] = jeton.split('.');
  if (!partie || !sig) return null;
  const attendu = signer(partie);
  const a = Buffer.from(attendu);
  const b = Buffer.from(sig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const charge = JSON.parse(Buffer.from(partie.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')) as SessionApprenant;
    if (!charge?.c || !charge?.a || typeof charge.e !== 'number') return null;
    if (charge.e < Math.floor(Date.now() / 1000)) return null;
    return charge;
  } catch {
    return null;
  }
}

/** Un jeton de lien (création ou changement de mot de passe) : aléatoire, long. */
export function jetonLien(): string {
  return randomBytes(24).toString('hex');
}

/** L'empreinte d'une clé d'API : on ne garde jamais la clé elle-même. */
export function empreinte(cle: string): string {
  return createHash('sha256').update(cle).digest('hex');
}
