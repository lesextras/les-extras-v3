/**
 * L'IDENTITÉ DES PARTIES, FIGÉE.
 *
 * Un devis est une offre : celui qui l'émet est tenu par ce qu'il a écrit,
 * aussi longtemps qu'il l'a annoncé. Tant que le document se reconstruisait à
 * la lecture depuis les profils courants, corriger une raison sociale ou un
 * SIRET réécrivait rétroactivement un devis déjà accepté — et rendait fausse
 * l'empreinte de la signature, qui portait sur un texte qui n'existait plus.
 *
 * On recopie donc l'identité des deux parties au moment où le devis part.
 * C'est volontairement de la duplication : ici, la donnée qui compte n'est pas
 * la valeur d'aujourd'hui, c'est celle du jour de l'engagement.
 */

/** Identité d'une partie, telle qu'elle figurera sur le document. */
export interface PartieFigee {
  name: string;
  legalName: string | null;
  siret: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  contactEmail: string | null;
  phone: string | null;
  /** Mention de TVA propre à ce compte, quand il en a déclaré une. */
  vatMention: string | null;
  /**
   * Coordonnées bancaires de la partie, figées comme le reste.
   *
   * Elles ne s'impriment que du côté de l'ÉMETTEUR, et seulement s'il les a
   * renseignées : c'est lui qui sera payé, c'est donc son IBAN qui doit
   * figurer. Les figer avec le reste évite qu'un changement de banque, six
   * mois plus tard, réécrive le devis qu'on a signé.
   */
  iban: string | null;
  bic: string | null;
}

export interface PartiesFigees {
  /** L'émetteur du devis : l'intervenant ou l'organisme qui chiffre. */
  provider: PartieFigee;
  /** Le destinataire : l'établissement qui décidera. */
  client: PartieFigee;
}

/** Les champs à sélectionner en base pour construire une `PartieFigee`. */
export const SELECT_PARTIE = {
  name: true,
  legalName: true,
  siret: true,
  address: true,
  postalCode: true,
  city: true,
  contactEmail: true,
  phone: true,
  vatMention: true,
  iban: true,
  bic: true,
} as const;

type CompteLisible = {
  name: string;
  legalName?: string | null;
  siret?: string | null;
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  contactEmail?: string | null;
  phone?: string | null;
  vatMention?: string | null;
  iban?: string | null;
  bic?: string | null;
};

export function figerPartie(compte: CompteLisible): PartieFigee {
  return {
    name: compte.name,
    legalName: compte.legalName ?? null,
    siret: compte.siret ?? null,
    address: compte.address ?? null,
    postalCode: compte.postalCode ?? null,
    city: compte.city ?? null,
    contactEmail: compte.contactEmail ?? null,
    phone: compte.phone ?? null,
    vatMention: compte.vatMention ?? null,
    iban: compte.iban ?? null,
    bic: compte.bic ?? null,
  };
}

/**
 * Relit un instantané stocké en base.
 *
 * Les devis antérieurs à cette version n'en ont pas : on renvoie `null`, et
 * l'appelant retombe alors sur les profils courants. C'est moins bon, mais
 * c'est ce qui existait — et cela reste préférable à un document vide.
 */
export function relirePartiesFigees(valeur: unknown): PartiesFigees | null {
  if (!valeur || typeof valeur !== 'object') return null;
  const v = valeur as Record<string, unknown>;
  if (!v.provider || !v.client) return null;
  return {
    provider: figerPartie(v.provider as CompteLisible),
    client: figerPartie(v.client as CompteLisible),
  };
}

/**
 * Relit l'instantané figé sur une FACTURE à son émission.
 *
 * Même forme que celui du devis, à ceci près que les rôles s'appellent ici
 * `emetteur` et `client` : sur un devis, celui qui chiffre est le prestataire ;
 * sur une facture, c'est l'émetteur, et c'est son SIRET qui l'engage. Le
 * client peut manquer — une facture sans client identifiable vaut mieux qu'un
 * faux client, et le format le dit plutôt que de le cacher.
 *
 * `null` sur un brouillon (rien n'est encore figé, et c'est voulu : un
 * brouillon doit suivre le profil) comme sur les factures antérieures à cette
 * version.
 */
export function lireInstantaneFacture(
  valeur: unknown,
): { emetteur: PartieFigee; client: PartieFigee | null } | null {
  if (!valeur || typeof valeur !== 'object') return null;
  const v = valeur as Record<string, unknown>;
  if (!v.emetteur) return null;
  return {
    emetteur: figerPartie(v.emetteur as CompteLisible),
    client: v.client ? figerPartie(v.client as CompteLisible) : null,
  };
}
