import type { ContactBypassBlockedReason, ContactBypassEventRow } from "@/app/actions/admin";

export type ContactBypassRiskScore = 0 | 1 | 2 | 3 | 4;

const BASE_SCORES: Record<ContactBypassBlockedReason, number> = {
  PHONE: 3,
  WHATSAPP: 3,
  TELEGRAM: 3,
  EMAIL: 2,
  EXTERNAL_URL: 1,
};

export function getContactBypassRiskScore(event: ContactBypassEventRow): ContactBypassRiskScore {
  let score = BASE_SCORES[event.blockedReason] ?? 0;
  if (event.sender.status === "BANNED" || event.sender.status === "PENDING") {
    score = Math.min(4, score + 1);
  }
  return score as ContactBypassRiskScore;
}

export function getContactBypassRiskLabel(score: ContactBypassRiskScore): string {
  if (score >= 3) return "Haut";
  if (score >= 2) return "Moyen";
  return "Bas";
}

export function getContactBypassRiskVariant(
  score: ContactBypassRiskScore,
): "coral" | "amber" | "quiet" {
  if (score >= 3) return "coral";
  if (score >= 2) return "amber";
  return "quiet";
}

export function getContactBypassReasonLabel(reason: ContactBypassBlockedReason): string {
  const labels: Record<ContactBypassBlockedReason, string> = {
    EMAIL: "Email",
    PHONE: "Téléphone",
    WHATSAPP: "WhatsApp",
    TELEGRAM: "Telegram",
    EXTERNAL_URL: "URL externe",
  };
  return labels[reason];
}

export function sortContactBypassEvents(
  events: ContactBypassEventRow[],
): ContactBypassEventRow[] {
  return [...events].sort((a, b) => {
    const scoreA = getContactBypassRiskScore(a);
    const scoreB = getContactBypassRiskScore(b);
    if (scoreA !== scoreB) return scoreB - scoreA;
    // Equal score: most recent first
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    if (isNaN(dateA) && isNaN(dateB)) return 0;
    if (isNaN(dateA)) return 1;
    if (isNaN(dateB)) return -1;
    return dateB - dateA;
  });
}
