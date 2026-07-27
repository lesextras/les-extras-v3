import { ContactBypassBlockedReason } from "@prisma/client";

const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PHONE_REGEX = /(?:\+?\d[\d\s().-]{7,}\d)/i;
const WHATSAPP_REGEX = /\b(?:whats\s*app|whatsapp)\b/i;
const TELEGRAM_REGEX = /\btelegram\b/i;
const EXTERNAL_URL_REGEX = /\b(?:https?:\/\/|www\.)\S+/i;

const BLOCKED_REASON_MESSAGES: Record<ContactBypassBlockedReason, string> = {
  EMAIL: "Le partage d'adresse email n'est pas autorisé dans la messagerie.",
  PHONE: "Le partage de numéro de téléphone n'est pas autorisé dans la messagerie.",
  WHATSAPP: "Le partage de coordonnées de messagerie externe n'est pas autorisé.",
  TELEGRAM: "Le partage de coordonnées de messagerie externe n'est pas autorisé.",
  EXTERNAL_URL: "Le partage de lien externe n'est pas autorisé dans la messagerie.",
};

export type ContactBypassDetection = {
  reason: ContactBypassBlockedReason;
  message: string;
};

function looksLikePhone(match: string) {
  const digits = match.replace(/\D/g, "");
  return digits.length >= 8;
}

export function detectContactBypass(content: string): ContactBypassDetection | null {
  const normalized = content.trim();
  if (!normalized) {
    return null;
  }

  if (EMAIL_REGEX.test(normalized)) {
    return {
      reason: ContactBypassBlockedReason.EMAIL,
      message: BLOCKED_REASON_MESSAGES.EMAIL,
    };
  }

  const phoneMatch = normalized.match(PHONE_REGEX)?.[0];
  if (phoneMatch && looksLikePhone(phoneMatch)) {
    return {
      reason: ContactBypassBlockedReason.PHONE,
      message: BLOCKED_REASON_MESSAGES.PHONE,
    };
  }

  if (WHATSAPP_REGEX.test(normalized)) {
    return {
      reason: ContactBypassBlockedReason.WHATSAPP,
      message: BLOCKED_REASON_MESSAGES.WHATSAPP,
    };
  }

  if (TELEGRAM_REGEX.test(normalized)) {
    return {
      reason: ContactBypassBlockedReason.TELEGRAM,
      message: BLOCKED_REASON_MESSAGES.TELEGRAM,
    };
  }

  if (EXTERNAL_URL_REGEX.test(normalized)) {
    return {
      reason: ContactBypassBlockedReason.EXTERNAL_URL,
      message: BLOCKED_REASON_MESSAGES.EXTERNAL_URL,
    };
  }

  return null;
}
