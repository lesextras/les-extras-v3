import {
  BookingStatus,
  DeskRequestPriority,
  DeskRequestStatus,
  DeskRequestType,
  InvoiceStatus,
  PaymentStatus,
  QuoteStatus,
  ReliefMissionStatus,
  ServiceType,
} from "@prisma/client";

export type AdminMissionRow = {
  id: string;
  title: string;
  address: string;
  status: ReliefMissionStatus;
  createdAt: string;
  dateStart: string;
  dateEnd: string;
  hourlyRate: number;
  establishmentName: string;
  establishmentEmail: string;
  candidatesCount: number;
};

export type AdminServiceRow = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  type: ServiceType;
  isFeatured: boolean;
  isHidden: boolean;
  createdAt: string;
  freelanceName: string;
  freelanceEmail: string;
};

export type AdminMissionLinkedDeskRequest = {
  id: string;
  type: DeskRequestType;
  status: DeskRequestStatus;
  priority: DeskRequestPriority;
  createdAt: string;
  messageExcerpt: string;
  requester: AdminMissionStakeholder | null;
};

export type AdminMissionDetail = {
  id: string;
  title: string;
  status: ReliefMissionStatus;
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

export type AdminMissionStakeholder = {
  id: string;
  name: string;
  email: string;
};

export type AdminMissionCandidate = {
  bookingId: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  proposedRate: number | null;
  freelanceAcknowledged: boolean;
  canAssign: boolean;
  freelance: AdminMissionStakeholder | null;
  latestQuote:
    | {
        id: string;
        status: QuoteStatus;
        totalTTC: number;
        createdAt: string;
        acceptedAt: string | null;
      }
    | null;
};

export type AdminMissionLinkedBooking = {
  id: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
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
        status: InvoiceStatus;
        amount: number;
        invoiceNumber: string | null;
        createdAt: string;
        updatedAt: string;
      }
    | null;
  latestQuote:
    | {
        id: string;
        status: QuoteStatus;
        totalTTC: number;
        createdAt: string;
        acceptedAt: string | null;
        rejectedAt: string | null;
      }
    | null;
};

export type AdminMissionConversationMessage = {
  id: string;
  type: "USER" | "SYSTEM";
  contentExcerpt: string;
  createdAt: string;
  senderName: string;
};

export type AdminMissionTimelineEventType =
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

export type AdminMissionTimelineEvent = {
  id: string;
  type: AdminMissionTimelineEventType;
  label: string;
  description?: string;
  timestamp: string;
};

export type AdminServiceDetail = {
  id: string;
  title: string;
  type: ServiceType;
  price: number;
  freelanceName: string;
  freelanceEmail: string;
  isFeatured: boolean;
  isHidden: boolean;
  description: string | null;
  createdAt: string;
};
