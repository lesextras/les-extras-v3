import { createHmac, randomBytes } from 'node:crypto';

/**
 * LE JETON D'ACCÈS AU SERVEUR MÉDIA.
 *
 * ⚠⚠ L'API NE VOIT JAMAIS LE FLUX, ET C'EST TOUT LE MODÈLE.
 *
 * Un serveur média WebRTC (LiveKit) ne s'interroge pas : on lui présente un
 * jeton signé avec le secret partagé, il en lit les droits et laisse entrer.
 * La vidéo et le son vont donc du navigateur au serveur média, en direct.
 * Notre API ne fait que SIGNER — elle ne relaie rien, n'enregistre rien, et ne
 * pourrait pas écouter même si quelqu'un le lui demandait. C'est ce qui permet
 * d'écrire, sans mentir, que la séance n'est pas enregistrée.
 *
 * C'est le montage de Doctolib dans son principe : un serveur de rendez-vous
 * qui délivre des droits, un serveur média qui transporte, et un relais TURN
 * sur le port 443 pour traverser les pare-feux d'établissement — c'est ce
 * dernier point qui décide si la visio marche depuis un IME ou pas.
 *
 * ⚠ LE JETON EST SIGNÉ À LA MAIN PLUTÔT QU'AVEC LE SDK LiveKit. Trois raisons,
 * et elles tiennent : c'est un JWT HS256 de quinze lignes ; le SDK serveur
 * tire une dépendance entière pour cette seule signature ; et une dépendance
 * de moins est une dépendance de moins à suivre sur un service qui porte des
 * séances avec des familles. Le format des revendications est celui que
 * LiveKit documente (`video.roomJoin`, `canPublish`, `canSubscribe`…) : s'il
 * change un jour, c'est ici, et nulle part ailleurs.
 *
 * ⚠ LE SECRET NE TRANSITE JAMAIS PAR LE NAVIGATEUR. Ce qui part au client,
 * c'est le jeton signé et l'adresse du serveur média. Le secret reste dans
 * l'environnement de l'API.
 */

/** Ce que le navigateur reçoit pour entrer dans la salle. */
export interface AccesSalle {
  /** Adresse du serveur média (wss://…). */
  url: string;
  /** Le jeton signé, valable le temps du rendez-vous. */
  jeton: string;
  /** Le nom de la salle, pour l'affichage et les journaux. */
  salle: string;
  /** Le nom affiché aux autres participants. */
  identite: string;
}

export interface ConfigMedia {
  url: string;
  cle: string;
  secret: string;
}

/**
 * La configuration du serveur média, ou `null`.
 *
 * ⚠ `null` N'EST PAS UNE PANNE, C'EST L'ÉTAT NORMAL TANT QUE LE SERVICE N'EST
 * PAS OUVERT. Les trois variables sont posées le jour où la visio est mise en
 * service ; d'ici là tout le reste du produit fonctionne, et les écrans
 * disent que la visio n'est pas disponible plutôt que d'afficher une erreur.
 */
export function configMedia(): ConfigMedia | null {
  const url = (process.env.LIVEKIT_URL ?? '').trim();
  const cle = (process.env.LIVEKIT_API_KEY ?? '').trim();
  const secret = (process.env.LIVEKIT_API_SECRET ?? '').trim();
  if (!url || !cle || !secret) return null;
  return { url, cle, secret };
}

function base64url(donnee: Buffer | string): string {
  return Buffer.from(donnee)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Signe un jeton d'accès LiveKit.
 *
 * @param identite  Ce que les autres participants voient. JAMAIS une adresse
 *                  e-mail ni un identifiant de compte : ce champ est affiché
 *                  en clair à l'écran de tout le monde dans la salle.
 * @param secondes  Durée de validité. Bornée au rendez-vous, pas à la journée.
 * @param animateur Vrai pour l'intervenant : il peut alors ouvrir la salle et
 *                  en retirer quelqu'un. Faux pour le demandeur.
 */
export function signerJetonSalle(
  config: ConfigMedia,
  options: { salle: string; identite: string; secondes: number; animateur: boolean },
): string {
  const maintenant = Math.floor(Date.now() / 1000);
  const entete = { alg: 'HS256', typ: 'JWT' };
  const charge = {
    // `iss` porte la clé d'API : c'est ainsi que LiveKit sait quel secret
    // utiliser pour vérifier la signature.
    iss: config.cle,
    sub: options.identite,
    // Le nom affiché dans la salle.
    name: options.identite,
    nbf: maintenant - 10,
    exp: maintenant + options.secondes,
    video: {
      room: options.salle,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      // ⚠ LA PUBLICATION DE DONNÉES EST OUVERTE (c'est le canal du clavardage
      // et des signaux d'interface), L'ENREGISTREMENT NE L'EST PAS. `roomRecord`
      // reste faux des deux côtés : personne, pas même l'intervenant, ne peut
      // déclencher un enregistrement depuis un jeton délivré ici.
      canPublishData: true,
      roomRecord: false,
      // Seul l'intervenant administre la salle : il l'ouvre, et il peut en
      // retirer quelqu'un qui n'a rien à y faire.
      roomAdmin: options.animateur,
    },
  };

  const partie = `${base64url(JSON.stringify(entete))}.${base64url(JSON.stringify(charge))}`;
  const signature = base64url(createHmac('sha256', config.secret).update(partie).digest());
  return `${partie}.${signature}`;
}

/**
 * Un nom de salle, et deux jetons de lien.
 *
 * ⚠ ALÉATOIRES, JAMAIS DÉRIVÉS. Un nom de salle construit à partir d'un
 * identifiant de réservation ou d'un nom de personne se devine, et une salle
 * qui se devine se rejoint. 32 caractères hexadécimaux, tirés du générateur
 * cryptographique du système — pas de `Math.random()`.
 */
export function tirerIdentifiant(prefixe = ''): string {
  return `${prefixe}${randomBytes(16).toString('hex')}`;
}
