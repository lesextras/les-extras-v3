/*
 * Web Push, écrit à la main (RFC 8291 pour le chiffrement, RFC 8292 pour VAPID).
 *
 * Pourquoi sans bibliothèque : le reste de la plateforme suit la même règle
 * (Stripe, Brevo) — une dépendance de moins à suivre, à auditer et à mettre à
 * jour, sur un serveur qui héberge des données médico-sociales.
 *
 * Le protocole tient en deux morceaux :
 *   1. on chiffre le message pour l'appareil (lui seul peut le lire, le service
 *      de push de Google ou d'Apple ne voit qu'un bloc opaque) ;
 *   2. on signe la requête avec la clé VAPID (le service de push vérifie ainsi
 *      que l'envoi vient bien de nous).
 */
import { createECDH, createHmac, createCipheriv, randomBytes, createPrivateKey, sign as signer, generateKeyPairSync } from 'node:crypto';

const COURBE = 'prime256v1';

export interface Abonnement {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface ClesVapid {
  publique: string;
  privee: string;
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function deB64url(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function hmac(cle: Buffer, donnee: Buffer): Buffer {
  return createHmac('sha256', cle).update(donnee).digest();
}

/** HKDF réduit au cas qui nous intéresse : une seule itération d'expansion. */
function hkdf(sel: Buffer, ikm: Buffer, info: Buffer, longueur: number): Buffer {
  const prk = hmac(sel, ikm);
  return hmac(prk, Buffer.concat([info, Buffer.from([1])])).subarray(0, longueur);
}

/** Génère une paire de clés VAPID. Appelé une seule fois, au premier démarrage. */
export function genererClesVapid(): ClesVapid {
  const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: COURBE });
  const jwkPub = publicKey.export({ format: 'jwk' }) as { x: string; y: string };
  const jwkPriv = privateKey.export({ format: 'jwk' }) as { d: string };
  const publique = Buffer.concat([Buffer.from([4]), deB64url(jwkPub.x), deB64url(jwkPub.y)]);
  return { publique: b64url(publique), privee: jwkPriv.d };
}

/** Reconstruit une clé privée utilisable à partir de sa seule valeur brute. */
function clePriveeDepuisBrut(privee: string) {
  const d = deB64url(privee);
  const ecdh = createECDH(COURBE);
  ecdh.setPrivateKey(d);
  const pub = ecdh.getPublicKey();
  return createPrivateKey({
    key: {
      kty: 'EC',
      crv: 'P-256',
      d: b64url(d),
      x: b64url(pub.subarray(1, 33)),
      y: b64url(pub.subarray(33, 65)),
    },
    format: 'jwk',
  });
}

/** En-tête d'autorisation VAPID : un JWT ES256 signé avec notre clé privée. */
function entetesVapid(endpoint: string, cles: ClesVapid, contact: string): Record<string, string> {
  const origine = new URL(endpoint).origin;
  const entete = b64url(Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const charge = b64url(
    Buffer.from(
      JSON.stringify({
        aud: origine,
        exp: Math.floor(Date.now() / 1000) + 12 * 3600,
        sub: contact,
      }),
    ),
  );
  const aSigner = Buffer.from(`${entete}.${charge}`);
  // dsaEncoding ieee-p1363 : signature brute r||s de 64 octets, comme l'exige
  // la spec. Le format DER par défaut de Node serait refusé.
  const signature = signer('sha256', aSigner, {
    key: clePriveeDepuisBrut(cles.privee),
    dsaEncoding: 'ieee-p1363',
  });
  return { Authorization: `vapid t=${entete}.${charge}.${b64url(signature)}, k=${cles.publique}` };
}

/** Chiffre le message pour cet appareil (aes128gcm). */
function chiffrer(abo: Abonnement, message: string): { corps: Buffer } {
  const clientPub = deB64url(abo.p256dh);
  const authSecret = deB64url(abo.auth);

  const ecdh = createECDH(COURBE);
  ecdh.generateKeys();
  const serveurPub = ecdh.getPublicKey();
  const partage = ecdh.computeSecret(clientPub);

  // Première dérivation : on mélange le secret partagé avec le sel d'auth du
  // navigateur et les deux clés publiques.
  const infoCle = Buffer.concat([
    Buffer.from('WebPush: info\0'),
    clientPub,
    serveurPub,
  ]);
  const ikm = hkdf(authSecret, partage, infoCle, 32);

  const sel = randomBytes(16);
  const cek = hkdf(sel, ikm, Buffer.from('Content-Encoding: aes128gcm\0'), 16);
  const nonce = hkdf(sel, ikm, Buffer.from('Content-Encoding: nonce\0'), 12);

  // 0x02 marque la fin du contenu (pas de remplissage supplémentaire).
  const clair = Buffer.concat([Buffer.from(message, 'utf8'), Buffer.from([2])]);
  const chiffreur = createCipheriv('aes-128-gcm', cek, nonce);
  const chiffre = Buffer.concat([chiffreur.update(clair), chiffreur.final(), chiffreur.getAuthTag()]);

  const tailleEnreg = Buffer.alloc(4);
  tailleEnreg.writeUInt32BE(4096, 0);
  const entete = Buffer.concat([sel, tailleEnreg, Buffer.from([serveurPub.length]), serveurPub]);

  return { corps: Buffer.concat([entete, chiffre]) };
}

export interface ResultatEnvoi {
  ok: boolean;
  statut: number;
  /** Vrai si le service de push nous dit que cet abonnement est mort. */
  perime: boolean;
}

/** Envoie une notification à un appareil. Ne lève jamais : renvoie le verdict. */
export async function envoyerPush(
  abo: Abonnement,
  message: string,
  cles: ClesVapid,
  contact: string,
  ttl = 12 * 3600,
): Promise<ResultatEnvoi> {
  try {
    const { corps } = chiffrer(abo, message);
    const reponse = await fetch(abo.endpoint, {
      method: 'POST',
      headers: {
        ...entetesVapid(abo.endpoint, cles, contact),
        'Content-Encoding': 'aes128gcm',
        'Content-Type': 'application/octet-stream',
        TTL: String(ttl),
        Urgency: 'high',
      },
      // Buffer n'est pas un BodyInit valide au sens des types du DOM : on
      // passe la vue Uint8Array sous-jacente, sans recopier les octets.
      body: new Uint8Array(corps.buffer, corps.byteOffset, corps.byteLength),
      signal: AbortSignal.timeout(10_000),
    });
    return {
      ok: reponse.ok,
      statut: reponse.status,
      // 404/410 : le navigateur a révoqué l'abonnement, il faut l'effacer.
      perime: reponse.status === 404 || reponse.status === 410,
    };
  } catch {
    return { ok: false, statut: 0, perime: false };
  }
}
