"use server";

import { revalidatePath } from "next/cache";
import { getAdminSessionToken } from "@/app/actions/_shared/admin-session";
import { apiRequest } from "@/lib/api";
import type { KycSummary, PendingKycDocumentRow, UserKycDocument } from "@/lib/kyc-documents";

export type AdminUserRole = "ESTABLISHMENT" | "FREELANCE" | "ADMIN";
export type AdminUserStatus = "PENDING" | "VERIFIED" | "BANNED";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  createdAt: string;
  kyc?: KycSummary | null;
};

export type AdminUserProfileDetails = {
  id: string;
  name: string;
  email: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  createdAt: string;
  jobTitle: string | null;
  bio: string | null;
  avatar: string | null;
  kyc: KycSummary;
  documents: UserKycDocument[];
};

export type AdminMissionRow = {
  id: string;
  title: string;
  address: string;
  city: string;
  status: "OPEN" | "ASSIGNED" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  dateStart: string;
  dateEnd: string;
  hourlyRate: number;
  establishmentName: string;
  establishmentEmail: string;
  candidatesCount: number;
};

export type AdminMissionLinkedDeskRequest = {
  id: string;
  type: DeskRequestType;
  status: "OPEN" | "IN_PROGRESS" | "ANSWERED" | "CLOSED";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  createdAt: string;
  messageExcerpt: string;
  requester: AdminMissionStakeholder | null;
};

export type AdminMissionStakeholder = {
  id: string;
  name: string;
  email: string;
};

export type AdminMissionConversationMessage = {
  id: string;
  type: "USER" | "SYSTEM";
  contentExcerpt: string;
  createdAt: string;
  senderName: string;
};

export type AdminMissionLinkedBooking = {
  id: string;
  status: AdminFinanceBookingStatus;
  paymentStatus: AdminFinancePaymentStatus;
  scheduledAt: string;
  createdAt: string;
  message: string | null;
  proposedRate: number | null;
  freelanceAcknowledged: boolean;
  assignedFreelance: AdminMissionStakeholder | null;
  conversation:
    | {
        id: string;
        createdAt: string;
        lastMessageAt: string | null;
        lastMessageExcerpt: string | null;
        recentMessages: AdminMissionConversationMessage[];
      }
    | null;
  invoice:
    | {
        id: string;
        status: AdminFinanceInvoiceStatus;
        amount: number;
        invoiceNumber: string | null;
        createdAt: string;
        updatedAt: string;
      }
    | null;
  latestQuote:
    | {
        id: string;
        status: AdminFinanceQuoteStatus;
        totalTTC: number;
        createdAt: string;
        acceptedAt: string | null;
        rejectedAt: string | null;
      }
    | null;
};

export type AdminMissionCandidate = {
  bookingId: string;
  status: AdminFinanceBookingStatus;
  paymentStatus: AdminFinancePaymentStatus;
  createdAt: string;
  proposedRate: number | null;
  freelanceAcknowledged: boolean;
  canAssign: boolean;
  freelance: AdminMissionStakeholder | null;
  latestQuote:
    | {
        id: string;
        status: AdminFinanceQuoteStatus;
        totalTTC: number;
        createdAt: string;
        acceptedAt: string | null;
      }
    | null;
};

export type AdminMissionTimelineEvent = {
  id: string;
  type:
    | "MISSION_CREATED"
    | "CANDIDATE_RECEIVED"
    | "MISSION_ASSIGNED"
    | "DESK_REQUEST_OPENED"
    | "CONVERSATION_LINKED"
    | "QUOTE_SENT"
    | "QUOTE_ACCEPTED"
    | "BOOKING_CONFIRMED"
    | "MISSION_COMPLETED"
    | "PAYMENT_PENDING"
    | "PAYMENT_PAID"
    | "MISSION_CANCELLED"
    | "ADMIN_ACTION";
  label: string;
  description?: string;
  timestamp: string;
};

export type AdminMissionDetail = {
  id: string;
  title: string;
  status: "OPEN" | "ASSIGNED" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  establishmentName: string;
  establishmentEmail: string;
  establishmentId: string;
  address: string;
  city: string | null;
  shift: string | null;
  dateStart: string;
  dateEnd: string;
  hourlyRate: number;
  candidatesCount: number;
  proposedTotalTTC: number | null;
  attentionItems: string[];
  assignedFreelance: AdminMissionStakeholder | null;
  linkedBooking: AdminMissionLinkedBooking | null;
  candidates: AdminMissionCandidate[];
  timeline: AdminMissionTimelineEvent[];
  linkedDeskRequests: AdminMissionLinkedDeskRequest[];
};

export type AdminServiceRow = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  type: "WORKSHOP" | "TRAINING";
  isFeatured: boolean;
  isHidden: boolean;
  createdAt: string;
  freelanceName: string;
  freelanceEmail: string;
};

export type AdminServiceDetail = {
  id: string;
  title: string;
  type: "WORKSHOP" | "TRAINING";
  price: number;
  freelanceName: string;
  freelanceEmail: string;
  isFeatured: boolean;
  isHidden: boolean;
  description: string | null;
  createdAt: string;
};

export type AdminOverviewData = {
  pendingUsersCount: number;
  openDeskRequestsCount: number;
  urgentOpenMissionsCount: number;
  featuredServicesCount: number;
  hiddenServicesCount: number;
  awaitingPaymentCount: number;
};

export type AdminFinanceSummary = {
  invoicesCount: number;
  paidInvoicesCount: number;
  unpaidInvoicesCount: number;
  totalInvoicedAmount: number;
  totalPaidAmount: number;
  totalOutstandingAmount: number;
  quotesSentCount: number;
  quotesAcceptedCount: number;
  bookingsAwaitingPaymentCount: number;
};

export type AdminFinanceBookingType = "MISSION" | "SERVICE";
export type AdminFinanceQuoteStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "REVISED";
export type AdminFinancePaymentStatus = "PENDING" | "PAID" | "CANCELLED";
export type AdminFinanceInvoiceStatus = "UNPAID" | "PAID";
export type AdminFinanceBookingStatus =
  | "PENDING"
  | "QUOTE_SENT"
  | "QUOTE_ACCEPTED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "AWAITING_PAYMENT"
  | "PAID"
  | "CANCELLED";

export type AdminFinanceInvoiceRow = {
  id: string;
  invoiceNumber: string | null;
  status: AdminFinanceInvoiceStatus;
  amount: number;
  createdAt: string;
  bookingId: string;
  bookingType: AdminFinanceBookingType;
  bookingTitle: string;
  scheduledAt: string;
  establishmentName: string;
  providerName: string;
};

export type AdminFinanceQuoteRow = {
  id: string;
  status: AdminFinanceQuoteStatus;
  totalTTC: number;
  createdAt: string;
  validUntil: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  bookingId: string;
  bookingType: AdminFinanceBookingType;
  bookingTitle: string;
  issuerName: string;
  requesterName: string;
};

export type AdminAwaitingPaymentBookingRow = {
  id: string;
  status: AdminFinanceBookingStatus;
  paymentStatus: AdminFinancePaymentStatus;
  amount: number | null;
  createdAt: string;
  scheduledAt: string;
  bookingType: AdminFinanceBookingType;
  bookingTitle: string;
  establishmentName: string;
  providerName: string;
  invoiceId: string | null;
  invoiceNumber: string | null;
};

type GetAdminUsersInput = {
  search?: string;
  role?: AdminUserRole | "ALL";
};

async function getAdminToken(): Promise<string> {
  return getAdminSessionToken();
}

function buildUsersQuery(input?: GetAdminUsersInput): string {
  const params = new URLSearchParams();

  if (input?.search?.trim()) {
    params.set("search", input.search.trim());
  }

  if (input?.role && input.role !== "ALL") {
    params.set("role", input.role);
  }

  const query = params.toString();
  return query ? `/admin/users?${query}` : "/admin/users";
}

export async function getAdminUsers(input?: GetAdminUsersInput): Promise<AdminUserRow[]> {
  const token = await getAdminToken();
  return apiRequest<AdminUserRow[]>(buildUsersQuery(input), {
    method: "GET",
    token,
  });
}

export async function getAdminOverview(): Promise<AdminOverviewData> {
  const token = await getAdminToken();
  return apiRequest<AdminOverviewData>("/admin/overview", {
    method: "GET",
    token,
  });
}

export async function getAdminFinanceSummary(): Promise<AdminFinanceSummary> {
  const token = await getAdminToken();
  return apiRequest<AdminFinanceSummary>("/admin/finance/summary", {
    method: "GET",
    token,
  });
}

export async function getAdminFinanceInvoices(): Promise<AdminFinanceInvoiceRow[]> {
  const token = await getAdminToken();
  return apiRequest<AdminFinanceInvoiceRow[]>("/admin/finance/invoices", {
    method: "GET",
    token,
  });
}

export async function getAdminFinanceQuotes(): Promise<AdminFinanceQuoteRow[]> {
  const token = await getAdminToken();
  return apiRequest<AdminFinanceQuoteRow[]>("/admin/finance/quotes", {
    method: "GET",
    token,
  });
}

export async function getAdminFinanceBookingsAwaitingPayment(): Promise<
  AdminAwaitingPaymentBookingRow[]
> {
  const token = await getAdminToken();
  return apiRequest<AdminAwaitingPaymentBookingRow[]>("/admin/finance/bookings-awaiting-payment", {
    method: "GET",
    token,
  });
}

export async function getAdminUserProfile(userId: string): Promise<AdminUserProfileDetails> {
  if (!userId) {
    throw new Error("Utilisateur introuvable.");
  }

  const token = await getAdminToken();
  return apiRequest<AdminUserProfileDetails>(`/admin/users/${userId}`, {
    method: "GET",
    token,
  });
}

export async function getPendingKycDocuments(): Promise<PendingKycDocumentRow[]> {
  const token = await getAdminToken();
  return apiRequest<PendingKycDocumentRow[]>("/admin/users/kyc/documents", {
    method: "GET",
    token,
  });
}

export async function verifyUser(userId: string): Promise<{ ok: true }> {
  if (!userId) {
    throw new Error("Utilisateur introuvable.");
  }

  const token = await getAdminToken();
  await apiRequest<{ ok: true }>(`/admin/users/${userId}/verify`, {
    method: "POST",
    token,
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { ok: true };
}

export async function banUser(userId: string): Promise<{ ok: true }> {
  if (!userId) {
    throw new Error("Utilisateur introuvable.");
  }

  const token = await getAdminToken();
  await apiRequest<{ ok: true }>(`/admin/users/${userId}/ban`, {
    method: "POST",
    token,
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { ok: true };
}

export async function reviewUserDocument(
  documentId: string,
  status: "APPROVED" | "REJECTED",
  reviewReason?: string,
): Promise<{ ok: true }> {
  if (!documentId) {
    throw new Error("Document introuvable.");
  }

  const token = await getAdminToken();
  await apiRequest<{ ok: true }>(`/admin/users/documents/${documentId}/review`, {
    method: "PATCH",
    token,
    body: {
      status,
      reviewReason,
    },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/kyc");
  revalidatePath("/account");
  revalidatePath("/dashboard");
  return { ok: true };
}

function getCityFromAddress(address: string): string {
  const city = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .at(-1);

  return city ?? address;
}

export async function getAdminMissions(): Promise<AdminMissionRow[]> {
  const token = await getAdminToken();
  const missions = await apiRequest<Omit<AdminMissionRow, "city">[]>("/admin/missions", {
    method: "GET",
    token,
  });

  return missions.map((mission) => ({
    ...mission,
    city: getCityFromAddress(mission.address),
  }));
}

export async function getAdminMissionDetail(missionId: string): Promise<AdminMissionDetail> {
  if (!missionId) {
    throw new Error("Mission introuvable.");
  }

  const token = await getAdminToken();
  return apiRequest<AdminMissionDetail>(`/admin/missions/${missionId}`, {
    method: "GET",
    token,
  });
}

export async function deleteMission(missionId: string): Promise<{ ok: true }> {
  if (!missionId) {
    throw new Error("Mission introuvable.");
  }

  const token = await getAdminToken();
  await apiRequest<{ ok: true }>(`/admin/missions/${missionId}/delete`, {
    method: "POST",
    token,
  });

  revalidatePath("/admin/missions");
  revalidatePath("/admin");
  revalidatePath("/bookings");
  revalidatePath("/marketplace");
  return { ok: true };
}

export async function reassignMission(
  missionId: string,
  bookingId: string,
): Promise<{ ok: true }> {
  if (!missionId || !bookingId) {
    throw new Error("Mission introuvable.");
  }

  const token = await getAdminToken();
  await apiRequest<{ ok: true }>(`/admin/missions/${missionId}/reassign`, {
    method: "POST",
    token,
    body: { bookingId },
  });

  revalidatePath("/admin/missions");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/renforts");
  revalidatePath("/bookings");
  revalidatePath("/marketplace");
  return { ok: true };
}

export async function getAdminServices(): Promise<AdminServiceRow[]> {
  const token = await getAdminToken();
  return apiRequest<AdminServiceRow[]>("/admin/services", {
    method: "GET",
    token,
  });
}

export async function getAdminServiceDetail(serviceId: string): Promise<AdminServiceDetail> {
  if (!serviceId) {
    throw new Error("Service introuvable.");
  }

  const token = await getAdminToken();
  return apiRequest<AdminServiceDetail>(`/admin/services/${serviceId}`, {
    method: "GET",
    token,
  });
}

export async function featureService(serviceId: string): Promise<{ ok: true }> {
  if (!serviceId) {
    throw new Error("Service introuvable.");
  }

  const token = await getAdminToken();
  await apiRequest<{ ok: true }>(`/admin/services/${serviceId}/feature`, {
    method: "POST",
    token,
  });

  revalidatePath("/admin/services");
  revalidatePath("/admin");
  revalidatePath("/marketplace");
  return { ok: true };
}

export async function hideService(serviceId: string): Promise<{ ok: true }> {
  if (!serviceId) {
    throw new Error("Service introuvable.");
  }

  const token = await getAdminToken();
  await apiRequest<{ ok: true }>(`/admin/services/${serviceId}/hide`, {
    method: "POST",
    token,
  });

  revalidatePath("/admin/services");
  revalidatePath("/admin");
  revalidatePath("/marketplace");
  return { ok: true };
}

// ─────────────────────────────────────────────
// DESK — Demandes d'informations
// ─────────────────────────────────────────────

export type DeskRequestStatus = "OPEN" | "IN_PROGRESS" | "ANSWERED" | "CLOSED";
export type DeskRequestType =
  | "MISSION_INFO_REQUEST"
  | "PAYMENT_ISSUE"
  | "BOOKING_FAILURE"
  | "PACK_PURCHASE_FAILURE"
  | "MISSION_PUBLISH_FAILURE"
  | "TECHNICAL_ISSUE"
  | "USER_REPORT"
  | "LITIGE";

export type FinanceIncidentType =
  | "PAYMENT_ISSUE"
  | "BOOKING_FAILURE"
  | "PACK_PURCHASE_FAILURE"
  | "MISSION_PUBLISH_FAILURE";
export type DeskRequestPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type AdminOutreachOrigin = "USER_PROFILE" | "CONTACT_BYPASS" | "MISSION_DETAIL";
export type ContactBypassBlockedReason =
  | "EMAIL"
  | "PHONE"
  | "WHATSAPP"
  | "TELEGRAM"
  | "EXTERNAL_URL";

type DeskAdminSummary = {
  id: string;
  email: string;
  profile: { firstName: string; lastName: string } | null;
};

export type DeskRequestRow = {
  id: string;
  type: DeskRequestType;
  priority: DeskRequestPriority;
  status: DeskRequestStatus;
  assignedToAdminId: string | null;
  message: string;
  response: string | null;
  answeredAt: string | null;
  createdAt: string;
  mission: { id: string; title: string } | null;
  booking: {
    id: string;
    status: string;
    paymentStatus: string;
    reliefMission: { title: string } | null;
    service: { title: string } | null;
    establishment: {
      id: string;
      email: string;
      profile: { firstName: string; lastName: string } | null;
    } | null;
  } | null;
  requester: {
    id: string;
    email: string;
    role?: string;
    profile: { firstName: string; lastName: string } | null;
  };
  assignedToAdmin: DeskAdminSummary | null;
  answeredBy: DeskAdminSummary | null;
};

export type ContactBypassEventRow = {
  id: string;
  conversationId: string | null;
  bookingId: string | null;
  blockedReason: ContactBypassBlockedReason;
  rawExcerpt: string;
  createdAt: string;
  sender: {
    id: string;
    email: string;
    name: string;
    role: AdminUserRole;
    status: AdminUserStatus;
  };
};

export async function getDeskRequests(): Promise<DeskRequestRow[]> {
  const token = await getAdminToken();
  return apiRequest<DeskRequestRow[]>("/admin/desk-requests", {
    method: "GET",
    token,
  });
}

export async function getContactBypassEvents(): Promise<ContactBypassEventRow[]> {
  try {
    const token = await getAdminToken();
    return await apiRequest<ContactBypassEventRow[]>("/admin/contact-bypass-events", {
      method: "GET",
      token,
    });
  } catch {
    return [];
  }
}

export async function sendAdminOutreach(
  userId: string,
  message: string,
  options?: {
    notifyByEmail?: boolean;
    origin?: AdminOutreachOrigin;
    contextId?: string;
  },
): Promise<{ ok: true }> {
  if (!userId) {
    throw new Error("Utilisateur introuvable.");
  }

  const token = await getAdminToken();
  await apiRequest(`/admin/outreach/${userId}`, {
    method: "POST",
    token,
    body: {
      message,
      notifyByEmail: options?.notifyByEmail ?? true,
      origin: options?.origin,
      contextId: options?.contextId,
    },
  });

  revalidatePath("/dashboard/inbox");
  revalidatePath("/admin/users");
  revalidatePath("/admin/missions");
  return { ok: true };
}

export async function monitorContactBypassEvent(id: string): Promise<{ ok: true }> {
  if (!id) {
    throw new Error("Événement introuvable.");
  }

  const token = await getAdminToken();
  await apiRequest(`/admin/contact-bypass-events/${id}/monitor`, {
    method: "POST",
    token,
  });

  revalidatePath("/admin/contournements");
  return { ok: true };
}

export async function updateDeskRequestStatus(
  id: string,
  status: DeskRequestStatus,
): Promise<{ ok: true }> {
  const token = await getAdminToken();
  await apiRequest<unknown>(`/admin/desk-requests/${id}/status`, {
    method: "PATCH",
    token,
    body: { status },
  });
  revalidatePath("/admin/demandes");
  revalidatePath("/admin/incidents");
  revalidatePath("/admin");
  revalidatePath("/dashboard/demandes");
  revalidatePath("/dashboard/inbox");
  return { ok: true };
}

export async function assignDeskRequest(
  id: string,
  adminId: string | null,
): Promise<{ ok: true }> {
  const token = await getAdminToken();
  await apiRequest<unknown>(`/admin/desk-requests/${id}/assign`, {
    method: "PATCH",
    token,
    body: { adminId },
  });
  revalidatePath("/admin/demandes");
  revalidatePath("/admin/incidents");
  revalidatePath("/dashboard/demandes");
  return { ok: true };
}

export async function respondToDeskRequest(
  id: string,
  response: string,
): Promise<{ ok: true }> {
  const token = await getAdminToken();
  await apiRequest<unknown>(`/admin/desk-requests/${id}/respond`, {
    method: "PATCH",
    token,
    body: { response },
  });
  revalidatePath("/admin/demandes");
  revalidatePath("/admin/incidents");
  revalidatePath("/admin");
  revalidatePath("/dashboard/demandes");
  revalidatePath("/dashboard/inbox");
  return { ok: true };
}

export async function createFinanceIncident(dto: {
  type: FinanceIncidentType;
  priority?: DeskRequestPriority;
  message: string;
  requesterEmail: string;
  bookingId?: string;
}): Promise<{ id: string }> {
  const token = await getAdminToken();
  const result = await apiRequest<{ id: string }>("/admin/desk-requests/finance", {
    method: "POST",
    token,
    body: dto,
  });
  revalidatePath("/admin/incidents");
  return result;
}
