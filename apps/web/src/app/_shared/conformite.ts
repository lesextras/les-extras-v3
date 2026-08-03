/**
 * Vocabulaire UNIQUE du coffre-fort de conformité.
 *
 * Ces libellés vivaient en double : une copie dans MonDossier (côté
 * intervenant) et une dans ComplianceManager (côté établissement) — et elles
 * avaient déjà divergé (« Diplôme d'État » d'un côté, « Diplôme d'État (DEES,
 * DEME…) » de l'autre). Une même pièce doit porter le même nom des deux côtés
 * de l'écran : l'intervenant dépose ce que l'établissement réclame.
 */

export type DocType =
  | "IDENTITY"
  | "DIPLOMA"
  | "CRIMINAL_RECORD"
  | "DRIVING_LICENSE"
  | "IBAN"
  | "AUTOENTREPRENEUR"
  | "VITALE"
  | "OTHER";

export type DocStatus = "MISSING" | "PENDING" | "VALID" | "EXPIRED";

export const TYPE_LABEL: Record<DocType, string> = {
  IDENTITY: "Carte nationale d'identité",
  DIPLOMA: "Diplôme d'État (DEES, DEME, DEAES, DEEJE…)",
  CRIMINAL_RECORD: "Casier judiciaire (bulletin n°3)",
  DRIVING_LICENSE: "Permis de conduire",
  IBAN: "IBAN / RIB",
  AUTOENTREPRENEUR: "Attestation URSSAF (auto-entrepreneur)",
  VITALE: "Carte Vitale / attestation",
  OTHER: "Autre pièce",
};

/** Pourquoi cette pièce est demandée. Une exigence expliquée se remplit. */
export const TYPE_POURQUOI: Partial<Record<DocType, string>> = {
  IDENTITY: "Vérification d'identité avant toute intervention auprès d'un public vulnérable.",
  DIPLOMA: "Justifie la qualification exigée par la convention collective.",
  CRIMINAL_RECORD:
    "Obligatoire pour intervenir auprès de mineurs ou de majeurs protégés. À renouveler chaque année.",
  DRIVING_LICENSE: "Demandé dès qu'une intervention suppose de transporter des personnes.",
  IBAN: "Nécessaire au règlement de vos factures.",
  AUTOENTREPRENEUR: "Attestation de vigilance URSSAF, exigée de tout prestataire indépendant.",
};

export type DocBadgeVariant = "muted" | "warning" | "success" | "destructive";

/**
 * Statuts, avec deux nuances de libellé : celui qu'on montre à l'INTERVENANT
 * (« À fournir » — c'est à lui d'agir) et celui qu'on montre à
 * l'ÉTABLISSEMENT (« Manquante » — c'est un constat). Même couleur partout.
 */
export const STATUS_META: Record<
  DocStatus,
  { label: string; labelIntervenant: string; variant: DocBadgeVariant; aide: string }
> = {
  MISSING: {
    label: "Manquante",
    labelIntervenant: "À fournir",
    variant: "muted",
    aide: "Cette pièce n'a pas encore été déposée.",
  },
  PENDING: {
    label: "En attente",
    labelIntervenant: "En attente de vérification",
    variant: "warning",
    aide: "Déposée. La structure la vérifie de son côté.",
  },
  VALID: {
    label: "Valide",
    labelIntervenant: "Vérifiée",
    variant: "success",
    aide: "Validée par la structure.",
  },
  EXPIRED: {
    label: "Expirée",
    labelIntervenant: "Périmée",
    variant: "destructive",
    aide: "La date de validité est dépassée : déposez une version à jour.",
  },
};
