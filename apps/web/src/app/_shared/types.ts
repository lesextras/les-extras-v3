// ============================================================================
// Types partagés côté Web-Marketplace (miroir léger du schéma Prisma).
// Ces types décrivent les réponses JSON de l'API (apps/api) consommées par les
// écrans. Ils sont volontairement permissifs (champs optionnels) pour rester
// robustes aux évolutions du backend.
// ============================================================================

export type AccountType = "ESTABLISHMENT" | "FREELANCE";
export type AccountRole = "OWNER" | "ADMIN" | "MANAGER" | "MEMBER";
export type GlobalRole = "USER" | "ADMIN";

export type MissionCategory =
  | "RENFORT"
  | "REMPLACEMENT"
  | "ATELIER_EDUCATIF"
  | "ATELIER_THERAPEUTIQUE"
  | "FORMATION"
  | "ANALYSE_PRATIQUES";

export type MissionStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "FILLED"
  | "CLOSED"
  | "CANCELLED";

export type MissionVisibility = "SALARIES" | "RESERVED" | "PUBLIC";

export type ServiceCategory =
  | "ATELIER"
  | "FORMATION"
  | "MEDIATION"
  | "ART_THERAPIE"
  | "PREVENTION";

export type ServiceStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type BookingStatus =
  | "REQUESTED"
  | "ACCEPTED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type InvoiceStatus = "DRAFT" | "ISSUED" | "PAID" | "CANCELLED";
export type InvitationStatus = "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
export type MembershipStatus = "ACTIVE" | "SUSPENDED";

export interface SessionUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  role: GlobalRole;
}

export interface SessionAccount {
  id: string;
  name: string;
  type: AccountType;
  slug?: string;
  /** rôle du user DANS ce compte */
  role: AccountRole;
  logoUrl?: string | null;
  /** Accès LEX illimité accordé à la main (sinon, l'accès dépend des crédits). */
  isMember?: boolean;
}

export interface Session {
  user: SessionUser;
  account: SessionAccount;
  /** comptes auxquels le user appartient (switcher) */
  accounts?: SessionAccount[];
  token: string;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  slug: string;
  legalName?: string | null;
  city?: string | null;
  postalCode?: string | null;
  logoUrl?: string | null;
  credits?: number;
}

export interface Profile {
  id: string;
  userId: string;
  bio?: string | null;
  job?: string | null;
  skills?: string[];
  city?: string | null;
  postalCode?: string | null;
  radiusKm?: number | null;
  hourlyRate?: string | number | null;
  available?: boolean;
  diplomaUrl?: string | null;
}

export interface PublicUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  profile?: Profile | null;
}

export interface Mission {
  id: string;
  accountId: string;
  account?: Account | null;
  title: string;
  description: string;
  category: MissionCategory;
  job?: string | null;
  startDate: string;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  city?: string | null;
  postalCode?: string | null;
  hourlyRate?: string | number | null;
  headcount: number;
  emergency?: boolean;
  attachmentUrl?: string | null;
  status: MissionStatus;
  /** Validation hiérarchique : publication demandée, en attente d'approbation. */
  attenteValidation?: boolean;
  visibility: MissionVisibility;
  /** AUTOMATIQUE : le premier qui accepte. FILE_ENGAGEMENT : l'établissement valide. */
  modeAttribution?: ModeAttribution;
  /** À qui l'offre a été adressée (RESEAU = diffusion normale en cascade). */
  cibleDiffusion?: CibleDiffusion;
  orgUnitId?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  bookings?: Booking[];
  engagements?: MissionEngagement[];
  _count?: { bookings?: number };
}

export type ModeAttribution = "AUTOMATIQUE" | "FILE_ENGAGEMENT";
export type CibleDiffusion = "RESEAU" | "CONNUS" | "UNITE" | "SELECTION";
export type EngagementStatut =
  | "EN_ATTENTE"
  | "PRESENTE"
  | "ACCEPTE"
  | "REFUSE"
  | "RETIRE"
  | "CADUC";

/** Une prise de mission dans la file d'engagement. */
export interface MissionEngagement {
  id: string;
  missionId: string;
  accountId: string;
  rang: number;
  statut: EngagementStatut;
  message?: string | null;
  presenteAt?: string | null;
  decideAt?: string | null;
  motifRefus?: string | null;
  createdAt: string;
  account?: Account & { owner?: PublicUser | null };
}

export interface Service {
  id: string;
  accountId: string;
  account?: Account | null;
  title: string;
  description: string;
  category: ServiceCategory;
  duration?: string | null;
  maxParticipants?: number | null;
  publicTarget?: string | null;
  price?: string | number | null;
  city?: string | null;
  status: ServiceStatus;
  /**
   * Le contenu pédagogique. Ces champs existent en base depuis le début mais
   * n'étaient remplis que par l'import de catalogue : le formulaire de création
   * ne les proposait pas.
   */
  objectives?: string | null;
  methodology?: string | null;
  evaluation?: string | null;
  prerequisites?: string | null;
  material?: string | null;
  publicTargets?: string[] | null;
  timeSlots?: string[] | null;
  /** Consultations de la fiche publique. */
  views?: number;
  /** Demandes de devis reçues sur cette fiche. */
  requestsCount?: number;
  createdAt: string;
}

export interface Booking {
  id: string;
  accountId: string;
  account?: Account | null;
  missionId?: string | null;
  mission?: Mission | null;
  serviceId?: string | null;
  service?: Service | null;
  applicant?: PublicUser | null;
  status: BookingStatus;
  scheduledAt?: string | null;
  /** Effectif annoncé à la demande de réservation d'un atelier. */
  participants?: number | null;
  /** Précisions du demandeur : public accueilli, objectifs, contraintes. */
  requestNote?: string | null;
  totalAmount?: string | number | null;
  cancelReason?: string | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  missionId?: string | null;
  mission?: Mission | null;
  participants?: PublicUser[];
  lastMessage?: Message | null;
  unreadCount?: number;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: PublicUser | null;
  body: string;
  readAt?: string | null;
  createdAt: string;
}

export interface Invoice {
  id: string;
  accountId: string;
  bookingId?: string | null;
  number: string;
  amount: string | number;
  status: InvoiceStatus;
  pdfUrl?: string | null;
  issuedAt?: string | null;
  createdAt: string;
}

export interface Membership {
  id: string;
  userId: string;
  accountId: string;
  role: AccountRole;
  status: MembershipStatus;
  user?: PublicUser & { email?: string };
  createdAt: string;
}

export interface Invitation {
  id: string;
  email: string;
  accountId: string;
  role: AccountRole;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
}

/**
 * Demande de rattachement envoyée par un compte « salarié » (créé en solo,
 * droits freelance en attendant) vers un établissement. Sens inverse d'une
 * Invitation : ici, c'est la personne qui a fait la démarche.
 */
export interface AttachmentRequest {
  id: string;
  message: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  requesterUser?: { id: string; email: string } | null;
  requesterAccount?: { id: string; name: string } | null;
}

export interface Review {
  id: string;
  authorId: string;
  targetId: string;
  author?: PublicUser | null;
  rating: number;
  comment?: string | null;
  createdAt: string;
}
