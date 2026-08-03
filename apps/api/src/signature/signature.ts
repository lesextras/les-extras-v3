import { createHash, randomInt, timingSafeEqual } from 'node:crypto';

/**
 * LE NOYAU DE LA SIGNATURE ÉLECTRONIQUE.
 *
 * Module pur, sans base de données ni réseau : il se teste seul, et c'est
 * important pour du code dont dépend la valeur probante d'un contrat.
 *
 * ── Ce que cette signature est, et ce qu'elle n'est pas ────────────────────
 *
 * L'article 1367 du code civil reconnaît la signature électronique dès lors
 * que le procédé identifie son auteur et garantit son lien avec l'acte. Ce
 * que produit ce module remplit ces deux conditions : c'est une signature
 * électronique SIMPLE, assortie d'un faisceau de preuves.
 *
 * Ce n'est ni une signature AVANCÉE, ni une signature QUALIFIÉE au sens du
 * règlement eIDAS. La différence ne porte pas sur la validité — une signature
 * simple est valable — mais sur la charge de la preuve : devant un conseil de
 * prud'hommes, c'est celui qui invoque une signature simple qui doit
 * démontrer la fiabilité du procédé. Une signature qualifiée, elle, bénéficie
 * d'une présomption.
 *
 * D'où le faisceau que l'on constitue : empreinte du document, code à usage
 * unique envoyé sur un canal distinct et vérifié, horodatage, adresse IP,
 * navigateur, journal d'événements que l'on n'efface jamais. C'est exactement
 * ce qu'un juge examine.
 *
 * Le jour où un tiers de confiance sera activé, ce module ne changera pas :
 * l'adaptateur se branche à côté.
 */

/** Durée de validité du code, en minutes. Assez pour aller lire son courriel. */
export const VALIDITE_CODE_MINUTES = 15;

/**
 * Nombre d'essais avant blocage. Trois est le compromis usuel : assez pour
 * une faute de frappe, trop peu pour deviner six chiffres au hasard.
 */
export const TENTATIVES_MAX = 3;

/**
 * L'empreinte du document.
 *
 * C'est la pièce maîtresse du faisceau : elle prouve qu'on a signé CE
 * texte-là. Modifier une virgule du contrat après coup change l'empreinte, et
 * la signature ne correspond plus. Sans elle, une signature électronique ne
 * vaut rien — on saurait que quelqu'un a cliqué, pas sur quoi.
 */
export function empreinte(contenu: string): string {
  return createHash('sha256').update(contenu, 'utf8').digest('hex');
}

/**
 * Un code à six chiffres, tiré d'une source cryptographique.
 *
 * `Math.random()` serait prévisible : il ne faut jamais l'utiliser pour ce
 * genre de secret, même court.
 */
export function genererCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

/**
 * Le code n'est jamais stocké en clair.
 *
 * On y ajoute un sel — l'identifiant de la signature — pour qu'une table
 * précalculée des empreintes de zéro à neuf cent quatre-vingt-dix-neuf mille
 * neuf cent quatre-vingt-dix-neuf soit inutilisable. Un million d'entrées se
 * calcule en quelques secondes ; le sel rend chaque table valable pour une
 * seule signature.
 */
export function hacherCode(code: string, sel: string): string {
  return createHash('sha256').update(`${sel}:${code}`, 'utf8').digest('hex');
}

/**
 * Comparaison à temps constant.
 *
 * Une comparaison ordinaire s'arrête au premier caractère différent, et la
 * durée de la réponse renseigne l'attaquant. Sur six chiffres et trois
 * tentatives, l'exploitation est théorique — mais un code de vérification est
 * précisément l'endroit où l'on ne prend pas ce genre de raccourci.
 */
export function codeCorrect(codeSaisi: string, hacheAttendu: string, sel: string): boolean {
  const a = Buffer.from(hacherCode(codeSaisi, sel), 'hex');
  const b = Buffer.from(hacheAttendu, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export type EchecVerification =
  | 'DEJA_SIGNEE'
  | 'ANNULEE'
  | 'REFUSEE'
  | 'EXPIREE'
  | 'TROP_DE_TENTATIVES'
  | 'CODE_ABSENT'
  | 'CODE_ERRONE'
  | 'DOCUMENT_MODIFIE';

export interface EtatSignature {
  statut: 'EN_ATTENTE' | 'SIGNEE' | 'REFUSEE' | 'EXPIREE' | 'ANNULEE';
  codeHache: string | null;
  codeExpireLe: Date | null;
  tentatives: number;
  empreinte: string;
}

export interface ResultatVerification {
  ok: boolean;
  echec?: EchecVerification;
  message?: string;
}

/**
 * Toutes les raisons de refuser une signature, dans l'ordre où elles doivent
 * être examinées.
 *
 * L'ordre compte : on vérifie l'état avant l'expiration, l'expiration avant
 * les tentatives, et le document en dernier. Un message qui dirait « code
 * erroné » alors que la demande est annulée enverrait l'utilisateur sur une
 * fausse piste.
 *
 * `empreinteActuelle` recalcule l'empreinte du document au moment de signer :
 * si le contrat a été modifié entre la demande et la signature, on refuse.
 * C'est la garantie du lien entre la signature et l'acte, et sans elle tout
 * le reste ne sert à rien.
 */
export function verifier(
  etat: EtatSignature,
  codeSaisi: string,
  sel: string,
  empreinteActuelle: string,
  maintenant: Date = new Date(),
): ResultatVerification {
  if (etat.statut === 'SIGNEE') {
    return { ok: false, echec: 'DEJA_SIGNEE', message: 'Ce document a déjà été signé.' };
  }
  if (etat.statut === 'ANNULEE') {
    return { ok: false, echec: 'ANNULEE', message: 'Cette demande de signature a été annulée.' };
  }
  if (etat.statut === 'REFUSEE') {
    return { ok: false, echec: 'REFUSEE', message: 'Cette demande de signature a été refusée.' };
  }
  if (etat.statut === 'EXPIREE') {
    return {
      ok: false,
      echec: 'EXPIREE',
      message: 'Cette demande de signature a expiré. Demandez-en une nouvelle.',
    };
  }
  if (!etat.codeHache || !etat.codeExpireLe) {
    return {
      ok: false,
      echec: 'CODE_ABSENT',
      message: "Aucun code n'a été envoyé pour cette signature.",
    };
  }
  if (etat.codeExpireLe.getTime() < maintenant.getTime()) {
    return {
      ok: false,
      echec: 'EXPIREE',
      message: `Le code a expiré — il n'est valable que ${VALIDITE_CODE_MINUTES} minutes. Demandez-en un nouveau.`,
    };
  }
  if (etat.tentatives >= TENTATIVES_MAX) {
    return {
      ok: false,
      echec: 'TROP_DE_TENTATIVES',
      message: `Trop de codes erronés (${TENTATIVES_MAX} essais). Demandez un nouveau code.`,
    };
  }
  if (etat.empreinte !== empreinteActuelle) {
    return {
      ok: false,
      echec: 'DOCUMENT_MODIFIE',
      message:
        "Le document a été modifié depuis la demande de signature. Par sécurité, la signature est refusée : une signature ne vaut que pour le texte exact qu'elle accompagne. Relancez une demande.",
    };
  }
  if (!codeCorrect(codeSaisi, etat.codeHache, sel)) {
    return { ok: false, echec: 'CODE_ERRONE', message: 'Code incorrect.' };
  }
  return { ok: true };
}

/** Un événement du journal. Écrit, jamais réécrit. */
export interface Evenement {
  type: string;
  detail?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  createdAt: Date;
}

export interface DossierPreuve {
  reference: string;
  document: { type: string; id: string; empreinte: string };
  signataire: { nom: string; email: string };
  statut: string;
  signeLe: Date | null;
  ip: string | null;
  userAgent: string | null;
  procede: string;
  chronologie: Evenement[];
  /** La portée juridique, écrite pour être lue par un non-juriste. */
  portee: string;
}

/**
 * Le dossier de preuve, tel qu'il sera imprimé et joint au contrat.
 *
 * Le texte de la portée est volontairement franc. Vendre une signature simple
 * en laissant croire qu'elle est qualifiée serait le genre de mensonge qui se
 * découvre au pire moment : le jour d'un litige.
 */
export function dossierPreuve(s: {
  id: string;
  documentType: string;
  documentId: string;
  empreinte: string;
  signataireNom: string;
  signataireEmail: string;
  statut: string;
  signeLe: Date | null;
  ip: string | null;
  userAgent: string | null;
  prestataire: string | null;
  evenements: Evenement[];
}): DossierPreuve {
  const interne = !s.prestataire;
  return {
    reference: s.id.slice(-12).toUpperCase(),
    document: { type: s.documentType, id: s.documentId, empreinte: s.empreinte },
    signataire: { nom: s.signataireNom, email: s.signataireEmail },
    statut: s.statut,
    signeLe: s.signeLe,
    ip: s.ip,
    userAgent: s.userAgent,
    procede: interne
      ? 'Signature électronique simple avec vérification par code à usage unique adressé par courriel'
      : `Signature déléguée au prestataire ${s.prestataire}`,
    portee: interne
      ? "Cette signature est une signature électronique simple au sens du règlement eIDAS. Elle est valable : l'article 1367 du code civil reconnaît la signature électronique dès lors que le procédé identifie son auteur et garantit son lien avec l'acte, ce que fait le faisceau de preuves ci-dessous — empreinte du document, code à usage unique vérifié, horodatage, adresse de connexion. Elle ne bénéficie pas, en revanche, de la présomption de fiabilité attachée à la signature qualifiée : en cas de contestation, c'est à celui qui l'invoque de démontrer la fiabilité du procédé. Le présent dossier est fait pour cela."
      : "Cette signature a été recueillie par un prestataire de services de confiance. Sa portée juridique et son niveau eIDAS sont ceux du certificat délivré par ce prestataire, dont l'attestation fait foi.",
    chronologie: [...s.evenements].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    ),
  };
}
