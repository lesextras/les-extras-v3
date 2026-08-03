/**
 * LA PROPOSITION D'ENGAGEMENT.
 *
 * Ce que produit SOS Renfort n'est pas un contrat de travail — c'est un
 * chiffrage. La plateforme trouve quelqu'un, annonce ce que coûterait son
 * engagement, et s'arrête là : c'est l'établissement qui embauche, en son nom
 * propre, avec son propre contrat.
 *
 * La distinction n'est pas cosmétique. Faire signer par la plateforme un
 * document appelé « contrat » entre un établissement et un intervenant, avec
 * une rémunération et une facturation, c'est exactement ce que le Conseil
 * d'État a regardé le 11 février 2025 dans l'affaire Mediflash : un
 * indépendant qui intervient dans les horaires, les locaux et sous
 * l'encadrement d'un établissement est en lien de subordination. Le document
 * doit donc dire ce qu'il est : une proposition chiffrée, base d'un CDD que
 * l'établissement établira lui-même.
 *
 * Module pur : aucune dépendance à Prisma, donc testable seul.
 */

/** Convertit « 09h00 », « 9:00 » ou « 09h » en minutes depuis minuit. */
export function minutesDepuisMinuit(heure?: string | null): number | null {
  if (!heure) return null;
  const m = heure.trim().match(/^(\d{1,2})\s*[h:]\s*(\d{0,2})$/i);
  if (!m) return null;
  const h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

/**
 * Durée d'une vacation, en heures.
 * Une fin antérieure au début désigne un service de nuit qui passe minuit —
 * courant en internat, il ne faut pas le compter en négatif.
 */
export function heuresParJour(debut?: string | null, fin?: string | null): number | null {
  const d = minutesDepuisMinuit(debut);
  const f = minutesDepuisMinuit(fin);
  if (d === null || f === null) return null;
  const minutes = f > d ? f - d : 24 * 60 - d + f;
  return Math.round((minutes / 60) * 100) / 100;
}

/** Nombre de jours couverts, bornes comprises. */
export function joursCouverts(debut: Date, fin?: Date | null): number {
  if (!fin) return 1;
  const j = 86_400_000;
  const a = Date.UTC(debut.getUTCFullYear(), debut.getUTCMonth(), debut.getUTCDate());
  const b = Date.UTC(fin.getUTCFullYear(), fin.getUTCMonth(), fin.getUTCDate());
  return Math.max(1, Math.round((b - a) / j) + 1);
}

export interface Chiffrage {
  heuresParJour: number | null;
  jours: number;
  heuresTotales: number | null;
  tauxHoraire: number | null;
  /** Masse salariale brute estimée : taux × heures. */
  brutEstime: number | null;
  /**
   * Ce que le chiffrage NE comprend PAS. Écrit noir sur blanc plutôt que
   * laissé à l'interprétation : les cotisations patronales dépendent de la
   * structure, de la convention et des exonérations applicables. Annoncer un
   * coût complet avec un taux inventé serait pire que ne rien annoncer.
   */
  avertissement: string;
}

export function chiffrer(m: {
  startDate: Date;
  endDate?: Date | null;
  startTime?: string | null;
  endTime?: string | null;
  hourlyRate?: number | null;
  headcount?: number | null;
}): Chiffrage {
  const parJour = heuresParJour(m.startTime, m.endTime);
  const jours = joursCouverts(m.startDate, m.endDate);
  const postes = Math.max(1, m.headcount ?? 1);
  const heuresTotales = parJour === null ? null : Math.round(parJour * jours * postes * 100) / 100;
  const taux = m.hourlyRate ?? null;
  const brut =
    heuresTotales === null || taux === null
      ? null
      : Math.round(heuresTotales * taux * 100) / 100;

  return {
    heuresParJour: parJour,
    jours,
    heuresTotales,
    tauxHoraire: taux,
    brutEstime: brut,
    avertissement:
      "Estimation de la rémunération brute seule. Les cotisations patronales s'y ajoutent : elles dépendent de votre convention collective, de votre effectif et des exonérations dont vous bénéficiez. Ce document n'est pas un contrat de travail — il sert de base au CDD que votre établissement conclura directement avec la personne.",
  };
}
