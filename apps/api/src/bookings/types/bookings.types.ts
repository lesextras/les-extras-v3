export type BookingLineType = "MISSION" | "SERVICE_BOOKING" | "BOOKING";

export type BookingLineStatus =
  | "PENDING"
  | "QUOTE_SENT"
  | "QUOTE_ACCEPTED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "AWAITING_PAYMENT"
  | "PAID"
  | "CANCELLED"
  | "ASSIGNED";

export type BookingLine = {
  lineId: string;
  lineType: BookingLineType;
  date: string;
  typeLabel: "Mission SOS" | "Atelier" | "Formation";
  interlocutor: string;
  status: BookingLineStatus;
  address: string;
  contactEmail: string;
  viewerSide?: "REQUESTER" | "PROVIDER";
  relatedBookingId?: string;
  title?: string;
  amount?: number;
  hasReview?: boolean;
  invoiceUrl?: string;
};

export type BookingsPageData = {
  lines: BookingLine[];
  nextStep: BookingLine | null;
};

export type BookingDetails = {
  address: string;
  contactEmail: string;
  contactPhone?: string;
  contactName?: string;
  missionTitle?: string;
  dateStart?: string;
  dateEnd?: string;
  planning?: OrderMissionPlanningLine[];
  shift?: string;
  hourlyRate?: number;
  accessInstructions?: string;
  hasTransmissions?: boolean;
  transmissionTime?: string;
  perks?: string[];
  freelanceAcknowledged?: boolean;
};

// ── Order Tracker Types ──

export type TimelineEventType =
  | "CREATED"
  | "QUOTE_SENT"
  | "QUOTE_ACCEPTED"
  | "QUOTE_REJECTED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "INVOICE_GENERATED"
  | "PAID"
  | "CANCELLED"
  | "MESSAGE_SYSTEM"
  | "REVIEW_SUBMITTED";

export type TimelineActor = {
  id: string;
  name: string;
  role: string;
};

export type TimelineEvent = {
  id: string;
  type: TimelineEventType;
  label: string;
  description?: string;
  actor?: TimelineActor;
  timestamp: string;
};

export type OrderParticipant = {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  avatar?: string;
  phone?: string;
};

export type OrderConversation = {
  id: string;
  messages: {
    id: string;
    content: string;
    senderId: string;
    type: string;
    metadata?: unknown;
    createdAt: string;
  }[];
};

export type OrderQuote = {
  id: string;
  status: string;
  subtotalHT: number;
  vatRate: number;
  vatAmount: number;
  totalTTC: number;
  validUntil?: string;
  conditions?: string;
  notes?: string;
  createdAt: string;
  acceptedAt?: string;
  rejectedAt?: string;
  issuer: { id: string; name: string };
  lines: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    unit: string;
    totalHT: number;
  }[];
};

export type OrderInvoice = {
  id: string;
  amount: number;
  status: string;
  invoiceNumber?: string;
  createdAt: string;
};

export type OrderMissionPlanningLine = {
  dateStart: string;
  heureDebut: string;
  dateEnd: string;
  heureFin: string;
};

export type OrderMission = {
  id: string;
  title: string;
  dateStart: string;
  dateEnd: string;
  address: string;
  hourlyRate: number;
  shift?: string;
  description?: string;
  planning?: OrderMissionPlanningLine[];
  slots?: OrderMissionPlanningLine[];
};

export type OrderService = {
  id: string;
  title: string;
  description?: string;
  price: number;
  durationMinutes: number;
  pricingType: string;
  pricePerParticipant?: number;
};

export type OrderTrackerData = {
  booking: {
    id: string;
    status: string;
    paymentStatus: string;
    message?: string;
    scheduledAt: string;
    nbParticipants?: number;
    createdAt: string;
  };
  mission?: OrderMission;
  service?: OrderService;
  requester: OrderParticipant;
  provider: OrderParticipant;
  freelance: OrderParticipant;
  establishment: OrderParticipant;
  conversation?: OrderConversation;
  quotes: OrderQuote[];
  timeline: TimelineEvent[];
  invoice?: OrderInvoice;
  review?: {
    id: string;
    rating: number;
    comment?: string;
    createdAt: string;
  };
};
