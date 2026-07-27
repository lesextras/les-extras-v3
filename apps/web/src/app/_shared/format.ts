import type { BadgeVariant } from '@/components/ui/badge';

// Helpers de formatage (dates, montants, libellés d'enums) — pures fonctions.

const EUR = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

export function formatMoney(value?: string | number | null): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "—";
  return EUR.format(n);
}

export function formatRate(value?: string | number | null): string {
  if (value === null || value === undefined || value === "") return "—";
  return `${formatMoney(value)}/h`;
}

export function formatDate(value?: string | Date | null): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatDateShort(value?: string | Date | null): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

export function formatDateTime(value?: string | Date | null): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(value?: string | Date | null): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  const diff = Date.now() - d.getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.round(h / 24);
  if (j < 7) return `il y a ${j} j`;
  return formatDateShort(d);
}

export function initials(firstName?: string | null, lastName?: string | null): string {
  const a = (firstName || "").trim()[0] || "";
  const b = (lastName || "").trim()[0] || "";
  return (a + b).toUpperCase() || "?";
}

export function fullName(firstName?: string | null, lastName?: string | null): string {
  return [firstName, lastName].filter(Boolean).join(" ") || "Utilisateur";
}

// ---- Libellés FR des enums ------------------------------------------------

export const MISSION_CATEGORY_LABEL: Record<string, string> = {
  RENFORT: "Renfort",
  REMPLACEMENT: "Remplacement",
  ATELIER_EDUCATIF: "Atelier éducatif",
  ATELIER_THERAPEUTIQUE: "Atelier thérapeutique",
  FORMATION: "Formation",
  ANALYSE_PRATIQUES: "Analyse des pratiques",
};

export const MISSION_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publiée",
  FILLED: "Pourvue",
  CLOSED: "Clôturée",
  CANCELLED: "Annulée",
};

export const MISSION_VISIBILITY_LABEL: Record<string, string> = {
  SALARIES: "Salariés",
  RESERVED: "Réseau réservé",
  PUBLIC: "Public",
};

export const SERVICE_CATEGORY_LABEL: Record<string, string> = {
  ATELIER: "Atelier",
  FORMATION: "Formation",
  MEDIATION: "Médiation",
  ART_THERAPIE: "Art-thérapie",
  PREVENTION: "Prévention",
};

export const SERVICE_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publié",
  ARCHIVED: "Archivé",
};

export const BOOKING_STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Candidature",
  ACCEPTED: "Acceptée",
  CONFIRMED: "Confirmée",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
};

export const INVOICE_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Brouillon",
  ISSUED: "Émise",
  PAID: "Payée",
  CANCELLED: "Annulée",
};

export const USER_STATUS_LABEL: Record<string, string> = {
  PENDING: "En attente",
  VERIFIED: "Vérifié",
  BANNED: "Banni",
  ANONYMIZED: "Supprimé (RGPD)",
};

export const GLOBAL_ROLE_LABEL: Record<string, string> = {
  USER: "Utilisateur",
  ADMIN: "Administrateur",
};

export function userStatusBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case "VERIFIED":
      return "default";
    case "BANNED":
      return "destructive";
    case "ANONYMIZED":
      // Neutre volontairement : exercer son droit à l'effacement n'est pas une sanction.
      return "outline";
    default:
      return "secondary";
  }
}

export function serviceBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case "PUBLISHED":
      return "default";
    case "ARCHIVED":
      return "destructive";
    default:
      return "outline";
  }
}

export const ACCOUNT_ROLE_LABEL: Record<string, string> = {
  OWNER: "Propriétaire",
  ADMIN: "Administrateur",
  MANAGER: "Manager",
  MEMBER: "Membre",
};

export const INVITATION_STATUS_LABEL: Record<string, string> = {
  PENDING: "En attente",
  ACCEPTED: "Acceptée",
  EXPIRED: "Expirée",
  REVOKED: "Révoquée",
};

// Variante shadcn Badge par statut (default | secondary | destructive | outline)
// Réexport du type du composant : une seule définition pour toute l'app.
export type { BadgeVariant };

export function bookingBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case "COMPLETED":
    case "CONFIRMED":
    case "ACCEPTED":
      return "default";
    case "CANCELLED":
      return "destructive";
    case "IN_PROGRESS":
      return "secondary";
    default:
      return "outline";
  }
}

export function missionBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case "PUBLISHED":
      return "default";
    case "FILLED":
      return "secondary";
    case "CANCELLED":
    case "CLOSED":
      return "destructive";
    default:
      return "outline";
  }
}

export function invoiceBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case "PAID":
      return "default";
    case "ISSUED":
      return "secondary";
    case "CANCELLED":
      return "destructive";
    default:
      return "outline";
  }
}
