"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, toUserFacingApiError } from "@/lib/api";
import { createUserDeskRequest } from "@/app/actions/desk";
import { getSession } from "@/lib/session";
import { atelierInvalidationPaths } from "@/lib/atelier-query-keys";
import type { ServiceSlot } from "@/lib/atelier-config";
import {
  normalizeServiceBookingErrorMessage,
  SERVICE_BOOKING_DATE_ERROR,
  SERVICE_BOOKING_FALLBACK_ERROR,
  SERVICE_BOOKING_PARTICIPANTS_ERROR,
} from "@/lib/service-booking-errors";
import type {
  MissionPlanningLine,
  RenfortPublicationMode,
} from "@/lib/mission-planning";
import { getMissionPlanning } from "@/lib/mission-planning";

export type MissionStatus = "OPEN" | "ASSIGNED" | "COMPLETED" | "CANCELLED";
export type ServiceType = "WORKSHOP" | "TRAINING";
export type PricingType = "SESSION" | "PER_PARTICIPANT" | "QUOTE";

export type SerializedService = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  type: ServiceType;
  capacity: number;
  // Extended atelier fields
  pricingType: PricingType;
  pricePerParticipant: number | null;
  durationMinutes: number;
  category: string | null;
  publicCible: string[] | null;
  materials: string | null;
  objectives: string | null;
  methodology: string | null;
  evaluation: string | null;
  slots: ServiceSlot[] | null;
  imageUrl?: string | null;
  scheduleInfo?: string | null;
  owner?: {
    id: string;
    profile?: {
      firstName: string;
      lastName: string;
      avatar: string | null;
      jobTitle: string | null;
      bio: string | null;
    } | null;
  };
};

export type MarketplaceData = {
  missions: SerializedMission[];
  services: SerializedService[];
  isDegraded: boolean;
  degradedReason?: string;
};

type CreateMissionInput = {
  title: string;
  dateStart: string;
  dateEnd: string;
  hourlyRate: number;
  address: string;
  isRenfort?: boolean;
  metier?: string;
  shift?: "JOUR" | "NUIT";
  city?: string;
  zipCode?: string;
  planning?: MissionPlanningLine[];
  publicationMode?: RenfortPublicationMode;
  // SOS Renfort v2
  description?: string;
  establishmentType?: string;
  targetPublic?: string[];
  unitSize?: string;
  requiredSkills?: string[];
  diplomaRequired?: boolean;
  hasTransmissions?: boolean;
  transmissionTime?: string;
  perks?: string[];
  exactAddress?: string;
  accessInstructions?: string;
};

type CreateServiceInput = {
  title: string;
  description?: string;
  price: number;
  type: ServiceType;
  capacity: number;
  pricingType?: PricingType;
  pricePerParticipant?: number;
  durationMinutes?: number;
  category?: string;
  publicCible?: string[];
  materials?: string;
  objectives?: string;
  methodology?: string;
  evaluation?: string;
  slots?: ServiceSlot[];
  imageUrl?: string;
  scheduleInfo?: string;
  status?: "DRAFT" | "ACTIVE";
};

export type SerializedMission = {
  id: string;
  title: string;
  dateStart: string;
  dateEnd: string;
  address: string;
  hourlyRate: number;
  status: MissionStatus;
  isRenfort: boolean;
  metier?: string | null;
  shift?: string | null;
  city?: string | null;
  zipCode?: string | null;
  planning?: MissionPlanningLine[] | null;
  slots?: MissionPlanningLine[] | null;
  // SOS Renfort v2
  description?: string | null;
  establishmentType?: string | null;
  targetPublic?: string[] | null;
  unitSize?: string | null;
  requiredSkills?: string[] | null;
  diplomaRequired?: boolean | null;
  hasTransmissions?: boolean | null;
  transmissionTime?: string | null;
  perks?: string[] | null;
  exactAddress?: string | null;
  accessInstructions?: string | null;
  isUrgent?: boolean;
  isNetworkMatch?: boolean;
  establishmentName?: string;
  requiredDiploma?: string[];
  establishment?: {
    profile?: {
      companyName: string | null;
      city: string | null;
      avatar: string | null;
    } | null;
  };
};

export type SerializedFreelance = {
  id: string;
  profile?: {
    firstName: string;
    lastName: string;
    avatar: string | null;
    jobTitle: string | null;
    city: string | null;
  } | null;
};

export type SerializedReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  author: {
    id: string;
    profile?: {
      firstName: string;
      lastName: string;
      avatar: string | null;
      companyName: string | null;
    } | null;
  };
};

export type SerializedFreelanceDetail = {
  id: string;
  isAvailable: boolean;
  profile?: {
    firstName: string;
    lastName: string;
    avatar: string | null;
    jobTitle: string | null;
    bio: string | null;
    city: string | null;
    skills: string[];
    siret: string | null;
    availableDays?: string[];
  } | null;
  reviewsReceived: SerializedReview[];
  ownerServices: SerializedService[];
};

function sortMarketplaceMissions(missions: SerializedMission[]): SerializedMission[] {
  return missions.sort((a, b) => {
    const left = getMissionPlanning(a);
    const right = getMissionPlanning(b);
    const leftDate = left.nextSlot?.start ?? left.firstSlot?.start ?? new Date(a.dateStart);
    const rightDate = right.nextSlot?.start ?? right.firstSlot?.start ?? new Date(b.dateStart);
    return leftDate.getTime() - rightDate.getTime();
  });
}

function withDeskNotification(message: string, deskNotified: boolean): string {
  return deskNotified ? `${message} Le Desk a été prévenu.` : message;
}

export async function getAvailableMissionsStrict(token?: string): Promise<SerializedMission[]> {
  const activeToken = token || (await getSession())?.token;
  if (!activeToken) return [];

  const missions = await apiRequest<SerializedMission[]>("/missions", {
    method: "GET",
    token: activeToken,
    label: "marketplace.missions",
  });
  return sortMarketplaceMissions(missions);
}

export async function getAvailableMissions(token?: string): Promise<SerializedMission[]> {
  try {
    return await getAvailableMissionsStrict(token);
  } catch (error) {
    console.error("getAvailableMissions error", error);
    return [];
  }
}

export async function getAvailableMission(id: string, token?: string): Promise<SerializedMission | null> {
  const activeToken = token || (await getSession())?.token;
  if (!activeToken) return null;

  try {
    return await apiRequest<SerializedMission>(`/missions/${id}`, {
      method: "GET",
      token: activeToken,
    });
  } catch (error) {
    console.error("getAvailableMission error", error);
    return null;
  }
}

export async function getFreelancesStrict(
  token?: string,
  label = "marketplace.freelances",
): Promise<SerializedFreelance[]> {
  const activeToken = token || (await getSession())?.token;
  if (!activeToken) return [];

  return await apiRequest<SerializedFreelance[]>("/users/freelances", {
    method: "GET",
    token: activeToken,
    label,
  });
}

export async function getFreelances(token?: string): Promise<SerializedFreelance[]> {
  try {
    return await getFreelancesStrict(token);
  } catch (error) {
    console.error("getFreelances error", error);
    return [];
  }
}

export async function getServicesCatalogue(
  token?: string,
  label = "marketplace.services",
): Promise<SerializedService[]> {
  const activeToken = token || (await getSession())?.token;
  if (!activeToken) return [];

  return await apiRequest<SerializedService[]>("/services", {
    method: "GET",
    token: activeToken,
    label,
  });
}

export async function getMarketplaceCatalogue(token?: string) {
  const activeToken = token || (await getSession())?.token;
  if (!activeToken) return { services: [], freelances: [] };

  const [services, freelances] = await Promise.all([
    getServicesCatalogue(activeToken, "marketplace.establishment.services"),
    getFreelancesStrict(activeToken, "marketplace.establishment.freelances"),
  ]);

  return { services, freelances };
}

export type MesAtelierBooking = {
  id: string;
  status: string;
  scheduledAt: string | null;
  nbParticipants: number | null;
  establishment: {
    id: string;
    profile: { firstName: string | null; lastName: string | null; companyName: string | null } | null;
  };
};

export type MesAtelierItem = SerializedService & {
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  bookings?: MesAtelierBooking[];
};

export type UpdateServiceActionResult =
  | { ok: true; data: SerializedService }
  | { ok: false; error: string };

export type DeleteServiceActionResult =
  | { ok: true }
  | { ok: false; error: string };

function toReadableActionError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return fallback;
}

function revalidateServicePaths(id: string) {
  revalidatePath(atelierInvalidationPaths.catalogue);
  revalidatePath(atelierInvalidationPaths.bookings);
  revalidatePath(atelierInvalidationPaths.dashboard);
  revalidatePath(atelierInvalidationPaths.mesAteliers);
  revalidatePath(`/marketplace/services/${id}`);
  revalidatePath(`/ateliers/${id}`);
}

function isExpectedServiceVisibilityError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.trim().toLowerCase();
  return (
    message.includes("service not found") ||
    message.includes("atelier ou formation introuvable") ||
    message.includes("api request failed (404)")
  );
}

export async function getMyAteliers(token?: string): Promise<MesAtelierItem[]> {
  const activeToken = token || (await getSession())?.token;
  if (!activeToken) return [];

  try {
    const services = await apiRequest<(SerializedService & { status?: string })[]>("/services/my", {
      method: "GET",
      token: activeToken,
      label: "services.mine",
    });

    return services
      .map((service) => ({
        ...service,
        status: (service.status as MesAtelierItem["status"]) || "ACTIVE",
      }))
      .sort((a, b) => a.title.localeCompare(b.title, "fr"));
  } catch (error) {
    console.error("getMyAteliers error", error);
    throw error instanceof Error
      ? error
      : new Error("Impossible de charger vos ateliers.");
  }
}

export async function updateServiceAction(
  id: string,
  data: Record<string, unknown>,
  token?: string,
) : Promise<UpdateServiceActionResult> {
  const activeToken = token || (await getSession())?.token;
  if (!activeToken) {
    return { ok: false, error: "Non connecté" };
  }

  try {
    const service = await apiRequest<SerializedService>(`/services/${id}`, {
      method: "PATCH",
      body: data,
      token: activeToken,
    });
    revalidateServicePaths(id);
    return { ok: true, data: service };
  } catch (error) {
    console.error("updateService error", error);
    return {
      ok: false,
      error: toReadableActionError(error, "Impossible de mettre à jour ce service."),
    };
  }
}

export async function deleteServiceAction(
  id: string,
  token?: string,
) : Promise<DeleteServiceActionResult> {
  const activeToken = token || (await getSession())?.token;
  if (!activeToken) {
    return { ok: false, error: "Non connecté" };
  }

  try {
    await apiRequest(`/services/${id}`, {
      method: "DELETE",
      token: activeToken,
    });
    revalidateServicePaths(id);
    return { ok: true };
  } catch (error) {
    console.error("deleteService error", error);
    return {
      ok: false,
      error: toReadableActionError(error, "Impossible de supprimer ce service."),
    };
  }
}

/** @deprecated Stub returning empty data — use getAvailableMissions() or getMarketplaceCatalogue() instead. */
export async function getMarketplaceData(token?: string): Promise<MarketplaceData> {
  return { missions: [], services: [], isDegraded: false };
}

export async function getService(id: string, token?: string): Promise<SerializedService | null> {
  let activeToken = token;
  if (!activeToken) {
    const session = await getSession();
    if (!session) return null;
    activeToken = session.token;
  }

  try {
    return await apiRequest<SerializedService>(`/services/${id}`, {
      method: "GET",
      token: activeToken,
    });
  } catch (error) {
    if (isExpectedServiceVisibilityError(error)) {
      return null;
    }

    console.error("GetService error:", error);
    throw error instanceof Error
      ? error
      : new Error("Impossible de charger ce service.");
  }
}

export async function getFreelanceById(id: string, token?: string): Promise<SerializedFreelanceDetail | null> {
  let activeToken = token;
  if (!activeToken) {
    const session = await getSession();
    if (!session) return null;
    activeToken = session.token;
  }

  try {
    return await apiRequest<SerializedFreelanceDetail>(`/users/freelances/${id}`, {
      method: "GET",
      token: activeToken,
    });
  } catch (error) {
    console.error("getFreelanceById error:", error);
    return null;
  }
}

export async function createMissionFromRenfort(
  input: CreateMissionInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Non connecté" };

  try {
    await apiRequest("/missions", {
      method: "POST",
      token: session.token,
      body: input,
      label: "renfort.publish",
    });
  } catch (error) {
    console.error("createMissionFromRenfort error", {
      title: input.title,
      publicationMode: input.publicationMode,
      city: input.city,
      planningCount: input.planning?.length ?? 0,
      error: error instanceof Error ? error.message : error,
    });
    const userMessage = toUserFacingApiError(error, "Impossible de publier le renfort pour le moment.");
    const deskResult = await createUserDeskRequest(
      "MISSION_PUBLISH_FAILURE",
      [
        "Échec de publication d'un renfort.",
        `Titre: ${input.title}`,
        `Mode: ${input.publicationMode ?? "SINGLE_MISSION"}`,
        `Ville: ${input.city ?? "Non renseignée"}`,
        `Plages: ${input.planning?.length ?? 0}`,
        `Erreur: ${userMessage}`,
      ].join("\n"),
    );

    return {
      ok: false,
      error: withDeskNotification(userMessage, deskResult.ok),
    };
  }

  try {
    revalidatePath("/marketplace");
    revalidatePath("/bookings");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/renforts");
  } catch {
    // Revalidation errors should not fail the action
  }
  return { ok: true };
}

export async function duplicateServiceAction(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Non connecté" };

  try {
    await apiRequest(`/services/${id}/duplicate`, {
      method: "POST",
      token: session.token,
    });
    revalidatePath(atelierInvalidationPaths.mesAteliers);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur lors de la duplication" };
  }
}

export async function createServiceFromPublish(input: CreateServiceInput): Promise<{ ok: true }> {
  const session = await getSession();
  if (!session) throw new Error("Non connecté");

  await apiRequest("/services", {
    method: "POST",
    token: session.token,
    body: input,
  });

  revalidatePath(atelierInvalidationPaths.catalogue);
  revalidatePath(atelierInvalidationPaths.bookings);
  revalidatePath(atelierInvalidationPaths.dashboard);
  revalidatePath(atelierInvalidationPaths.mesAteliers);
  return { ok: true };
}

function getServiceBookingErrorMessage(error: unknown): string {
  const message = toUserFacingApiError(error, SERVICE_BOOKING_FALLBACK_ERROR);
  return normalizeServiceBookingErrorMessage(message);
}

function getRawErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }

  return "Erreur inconnue";
}

function getBookingDateForPayload(date: Date): string | null {
  if (!(date instanceof Date)) {
    return null;
  }

  const timestamp = date.getTime();
  return Number.isNaN(timestamp) ? null : date.toISOString();
}

export async function bookService(
  serviceId: string,
  date: Date,
  message?: string,
  nbParticipants?: number,
): Promise<{ ok: true } | { error: string }> {
  if (!serviceId) return { error: "Service manquant." };

  const requestedDate = getBookingDateForPayload(date);
  const requestedTimestamp = date instanceof Date ? date.getTime() : Number.NaN;
  if (!requestedDate || requestedTimestamp <= Date.now()) {
    return { error: SERVICE_BOOKING_DATE_ERROR };
  }

  const normalizedParticipants = nbParticipants ?? 1;
  if (!Number.isInteger(normalizedParticipants) || normalizedParticipants < 1) {
    return { error: SERVICE_BOOKING_PARTICIPANTS_ERROR };
  }

  const session = await getSession();
  if (!session) return { error: "Non connecté" };

  try {
    await apiRequest(`/services/${serviceId}/book`, {
      method: "POST",
      token: session.token,
      body: {
        date: requestedDate,
        message,
        nbParticipants: normalizedParticipants,
      },
    });

    revalidatePath(atelierInvalidationPaths.catalogue);
    revalidatePath(atelierInvalidationPaths.bookings);
    revalidatePath(atelierInvalidationPaths.dashboard);
    revalidatePath(atelierInvalidationPaths.mesAteliers);
    return { ok: true };
  } catch (error) {
    const rawError = getRawErrorMessage(error);
    const userMessage = getServiceBookingErrorMessage(error);
    console.error("bookService error", {
      serviceId,
      date: requestedDate,
      nbParticipants: normalizedParticipants,
      error: rawError,
    });
    const deskResult = await createUserDeskRequest(
      "BOOKING_FAILURE",
      [
        "Échec de réservation atelier/formation.",
        `Service: ${serviceId}`,
        `Date demandée: ${requestedDate}`,
        `Participants: ${normalizedParticipants}`,
        `Erreur utilisateur: ${userMessage}`,
        `Erreur brute: ${rawError}`,
      ].join("\n"),
    );

    return { error: withDeskNotification(userMessage, deskResult.ok) };
  }
}
