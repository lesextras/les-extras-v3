import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { BookingLine } from "@/app/actions/bookings";
import type { EstablishmentMission } from "@/app/actions/missions";
import type { EstablishmentDashboardProps } from "@/app/(dashboard)/dashboard/_components/EstablishmentDashboard";
import type { EstablishmentTrustProfile } from "@/lib/establishment-trust";

const establishmentChecklistWidgetSpy = vi.hoisted(() => vi.fn());

vi.mock("@/components/dashboard/NextMissionCard", () => ({
  NextMissionCard: ({ title }: { title: string }) => (
    <div data-testid="next-mission-card">{title}</div>
  ),
}));

vi.mock("@/components/dashboard/RecentReviewsWidget", () => ({
  RecentReviewsWidget: () => <div>Avis récents</div>,
}));

vi.mock("@/components/dashboard/establishment/RenfortsWidget", () => ({
  RenfortsWidget: () => <div>Renforts actifs</div>,
}));

vi.mock("@/components/dashboard/establishment/PublishRenfortButton", () => ({
  PublishRenfortButton: ({ label = "Publier un renfort" }: { label?: string }) => (
    <button type="button">{label}</button>
  ),
}));

vi.mock("@/components/dashboard/establishment/EstablishmentInvoicesWidget", () => ({
  EstablishmentInvoicesWidget: () => <div>Factures établissement</div>,
}));

vi.mock("@/components/dashboard/establishment/EstablishmentChecklistWidget", () => ({
  EstablishmentChecklistWidget: (props: { trustProfile: EstablishmentTrustProfile }) => {
    establishmentChecklistWidgetSpy(props);

    return (
      <div>
        <a href="/account/establishment">Compléter ma fiche</a>
        {props.trustProfile.steps.map((step) => (
          <span key={step.id}>{step.label}</span>
        ))}
      </div>
    );
  },
}));

vi.mock("@/components/dashboard/CreditsWidget", () => ({
  CreditsWidget: ({ credits }: { credits: number | null }) => <div>{credits ?? "—"} crédits</div>,
}));

vi.mock("@/components/layout/BentoSection", () => ({
  BentoSection: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  BentoItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const { EstablishmentDashboard } = await import(
  "@/app/(dashboard)/dashboard/_components/EstablishmentDashboard"
);

const assignedMission: EstablishmentMission = {
  id: "mission-assigned",
  title: "Renfort éducateur spécialisé",
  dateStart: "2099-04-12T10:00:00.000Z",
  dateEnd: "2099-04-12T18:00:00.000Z",
  address: "Lyon",
  hourlyRate: 28,
  status: "ASSIGNED",
  isRenfort: true,
  city: "Lyon",
  bookings: [{ id: "booking-assigned", status: "CONFIRMED", freelanceId: "free-1" }],
};

const openMission: EstablishmentMission = {
  id: "mission-open",
  title: "Renfort cuisine",
  dateStart: "2099-04-13T10:00:00.000Z",
  dateEnd: "2099-04-13T18:00:00.000Z",
  address: "Marseille",
  hourlyRate: 24,
  status: "OPEN",
  isRenfort: true,
  city: "Marseille",
  bookings: [],
};

const pendingCandidateMission: EstablishmentMission = {
  ...openMission,
  id: "mission-pending-candidate",
  title: "Mission avec candidat",
  bookings: [{ id: "booking-pending", status: "PENDING", freelanceId: "free-2" }],
};

const awaitingPaymentBooking: BookingLine = {
  lineId: "line-awaiting-payment",
  lineType: "MISSION",
  date: "2099-04-12T10:00:00.000Z",
  typeLabel: "Mission SOS",
  interlocutor: "Nora Martin",
  status: "COMPLETED_AWAITING_PAYMENT",
  address: "Lyon",
  contactEmail: "contact@example.com",
  relatedBookingId: "booking-assigned",
};

const establishmentTrustProfile: EstablishmentTrustProfile = {
  progress: 50,
  completedCount: 3,
  totalCount: 6,
  steps: [
    { id: "companyName", label: "Nom de l'établissement renseigné", status: "COMPLETED" },
    { id: "bio", label: "Description de la structure renseignée", status: "MISSING", actionLabel: "Compléter", href: "/account/establishment" },
    { id: "contact", label: "Coordonnées complètes", status: "MISSING", actionLabel: "Compléter", href: "/account/establishment" },
    { id: "siret", label: "SIRET renseigné", status: "COMPLETED" },
    { id: "firstRenfort", label: "Premier renfort publié", status: "COMPLETED" },
    { id: "credits", label: "Crédits disponibles", status: "MISSING", actionLabel: "Ajouter", href: "/dashboard/packs" },
  ],
};

function renderDashboard(overrides: Partial<EstablishmentDashboardProps> = {}) {
  const props: EstablishmentDashboardProps = {
    activeMissions: [],
    missionsError: null,
    pendingQuotes: [],
    quotesError: null,
    invoices: [],
    invoicesError: null,
    availableCredits: 12,
    creditsError: null,
    pendingCandidatures: 2,
    awaitingPaymentBookings: [],
    confirmedBookings: [],
    completedBookings: [],
    bookingsError: null,
    nextMission: null,
    recentReviews: [],
    recentReviewsError: null,
    openDeskRequests: [],
    deskRequestsError: null,
    renfortsToFill: 1,
    renfortsToFillMissions: [],
    missionsWithPendingCandidates: [],
    upcomingInterventions: 3,
    establishmentTrustProfile,
    ...overrides,
  };

  return render(<EstablishmentDashboard {...props} />);
}

describe("EstablishmentDashboard", () => {
  beforeEach(() => {
    establishmentChecklistWidgetSpy.mockClear();
  });

  it("affiche les KPI actionnables sans Note moyenne", () => {
    renderDashboard();

    expect(
      screen
        .getAllByRole("link", { name: /renforts à pourvoir/i })
        .some((link) => link.getAttribute("href") === "/dashboard/renforts"),
    ).toBe(true);
    expect(
      screen
        .getAllByRole("link", { name: /candidatures à décider/i })
        .some((link) => link.getAttribute("href") === "/dashboard/renforts"),
    ).toBe(true);
    expect(screen.getByRole("link", { name: /interventions à venir/i })).toHaveAttribute(
      "href",
      "/bookings",
    );
    expect(screen.getByRole("link", { name: /crédits disponibles/i })).toHaveAttribute(
      "href",
      "/dashboard/packs",
    );
    expect(screen.queryByText(/note moyenne/i)).not.toBeInTheDocument();
  });

  it("n'affiche pas la prochaine intervention quand aucune mission assignée future n'est fournie", () => {
    renderDashboard({
      activeMissions: [
        {
          ...assignedMission,
          id: "mission-open",
          status: "OPEN",
          bookings: [],
        },
      ],
      nextMission: null,
    });

    expect(screen.queryByTestId("next-mission-card")).not.toBeInTheDocument();
  });

  it("affiche la prochaine intervention pour une mission assignée future", () => {
    renderDashboard({ nextMission: assignedMission });

    expect(screen.getByTestId("next-mission-card")).toHaveTextContent(
      "Renfort éducateur spécialisé",
    );
  });

  it("ne met pas les propositions reçues en action prioritaire quand les devis sont vides", () => {
    renderDashboard({ pendingQuotes: [] });

    expect(screen.queryByText(/propositions reçues/i)).not.toBeInTheDocument();
  });

  it("ne montre pas deux CTA contradictoires pour une même mission terminée", () => {
    renderDashboard({ awaitingPaymentBookings: [awaitingPaymentBooking] });

    expect(screen.getByRole("button", { name: /valider les heures/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /valider le paiement/i })).not.toBeInTheDocument();
  });

  it("affiche les candidatures à décider quand une mission a une candidature PENDING", () => {
    renderDashboard({
      pendingCandidatures: 1,
      missionsWithPendingCandidates: [pendingCandidateMission],
    });

    expect(screen.getByText("Mission avec candidat")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /voir les candidatures pour mission avec candidat/i })).toHaveAttribute(
      "href",
      "/dashboard/renforts",
    );
  });

  it("affiche les renforts OPEN à pourvoir", () => {
    renderDashboard({
      renfortsToFill: 1,
      renfortsToFillMissions: [openMission],
    });

    expect(screen.getByText("Renfort cuisine")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /gérer les candidatures pour renfort cuisine/i })).toHaveAttribute(
      "href",
      "/dashboard/renforts",
    );
  });

  it("n'affiche pas une mission assignée dans Renforts à pourvoir", () => {
    renderDashboard({
      renfortsToFill: 1,
      renfortsToFillMissions: [openMission],
      nextMission: null,
    });

    expect(screen.getByText("Renfort cuisine")).toBeInTheDocument();
    expect(screen.queryByText("Renfort éducateur spécialisé")).not.toBeInTheDocument();
  });

  it("transmet un profil de confiance établissement dynamique au widget", () => {
    const dynamicTrustProfile: EstablishmentTrustProfile = {
      progress: 17,
      completedCount: 1,
      totalCount: 6,
      steps: [
        { id: "companyName", label: "Nom API", status: "COMPLETED" },
        { id: "bio", label: "Bio API", status: "MISSING", actionLabel: "Compléter", href: "/account/establishment" },
        { id: "contact", label: "Coordonnées API", status: "MISSING", actionLabel: "Compléter", href: "/account/establishment" },
        { id: "siret", label: "SIRET renseigné", status: "MISSING", actionLabel: "Compléter", href: "/account/establishment" },
        { id: "firstRenfort", label: "Renfort API", status: "MISSING", actionLabel: "Publier", href: "/dashboard/renforts" },
        { id: "credits", label: "Crédits API", status: "MISSING", actionLabel: "Ajouter", href: "/dashboard/packs" },
      ],
    };

    renderDashboard({ establishmentTrustProfile: dynamicTrustProfile });

    expect(establishmentChecklistWidgetSpy).toHaveBeenCalledWith({
      trustProfile: dynamicTrustProfile,
    });
  });

  it("n'affiche plus SIRET vérifié et propose le CTA fiche établissement", () => {
    renderDashboard();

    expect(screen.queryByText(/SIRET vérifié/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /compléter ma fiche/i })).toHaveAttribute(
      "href",
      "/account/establishment",
    );
  });
});
