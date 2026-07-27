import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FreelanceDashboard } from "@/app/(dashboard)/dashboard/_components/FreelanceDashboard";
import type { BookingLine } from "@/app/actions/bookings";
import type { MyDeskRequest } from "@/app/actions/desk";
import type { MesAtelierItem } from "@/app/actions/marketplace";
import type { FreelanceTrustProfile } from "@/lib/freelance-trust";

const trustChecklistWidgetSpy = vi.hoisted(() => vi.fn());

vi.mock("@/components/dashboard/MatchingMissionsWidget", () => ({
  MatchingMissionsWidget: () => <div>Missions ciblées</div>,
}));

vi.mock("@/components/dashboard/BookingListWidget", () => ({
  BookingListWidget: ({ emptyMessage }: { emptyMessage?: string }) => (
    <div>{emptyMessage}</div>
  ),
}));

vi.mock("@/components/dashboard/TrustChecklistWidget", () => ({
  TrustChecklistWidget: (props: { trustProfile: unknown }) => {
    trustChecklistWidgetSpy(props);
    return <div>Confiance freelance</div>;
  },
}));

vi.mock("@/components/dashboard/NextMissionCard", () => ({
  NextMissionCard: () => <div>Prochaine mission</div>,
}));

vi.mock("@/components/dashboard/RecentReviewsWidget", () => ({
  RecentReviewsWidget: () => <div>Avis récents</div>,
}));

vi.mock("@/components/layout/BentoSection", () => ({
  BentoSection: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BentoItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const service: MesAtelierItem = {
  id: "svc-1",
  title: "Atelier communication",
  description: null,
  price: 120,
  type: "WORKSHOP",
  capacity: 10,
  pricingType: "SESSION",
  pricePerParticipant: null,
  durationMinutes: 60,
  category: null,
  publicCible: null,
  materials: null,
  objectives: null,
  methodology: null,
  evaluation: null,
  slots: null,
  status: "ACTIVE",
};

const draftService: MesAtelierItem = {
  ...service,
  id: "svc-2",
  title: "Formation posture professionnelle",
  type: "TRAINING",
  status: "DRAFT",
};

const upcomingMission: BookingLine = {
  lineId: "mission-1",
  lineType: "MISSION",
  date: "2027-04-12T10:00:00.000Z",
  typeLabel: "Mission SOS",
  interlocutor: "EHPAD B",
  status: "CONFIRMED",
  address: "Lyon",
  contactEmail: "contact@example.com",
};

const pendingApplication: BookingLine = {
  ...upcomingMission,
  lineId: "mission-2",
  status: "PENDING",
};

const deskRequest: MyDeskRequest = {
  id: "dr-1",
  type: "MISSION_INFO_REQUEST",
  status: "OPEN",
  message: "Question sur le public",
  response: null,
  answeredAt: null,
  createdAt: "2026-04-10T10:00:00.000Z",
  mission: { id: "m-1", title: "Renfort éducateur spécialisé" },
  booking: null,
  answeredBy: null,
};

const trustProfile: FreelanceTrustProfile = {
  progress: 50,
  completedCount: 4,
  totalCount: 8,
  steps: [
    { id: "identity", label: "Identité renseignée", status: "COMPLETED" },
    { id: "bio", label: "Présentation ajoutée", status: "COMPLETED" },
    { id: "skills", label: "Compétences renseignées", status: "COMPLETED" },
    { id: "phone", label: "Téléphone renseigné", status: "COMPLETED" },
    { id: "siret", label: "SIRET renseigné", status: "MISSING", actionLabel: "Compléter", href: "/account" },
    { id: "location", label: "Adresse et ville renseignées", status: "PENDING", actionLabel: "Compléter", href: "/account" },
    { id: "availableDays", label: "Disponibilités définies", status: "MISSING", actionLabel: "Compléter", href: "/account" },
    { id: "availability", label: "Profil ouvert aux missions", status: "MISSING", actionLabel: "Activer", href: "/account" },
  ],
};

describe("FreelanceDashboard", () => {
  beforeEach(() => {
    trustChecklistWidgetSpy.mockClear();
  });

  it("met en avant la plateforme hybride, les services et les demandes Desk", () => {
    render(
      <FreelanceDashboard
        confirmedBookings={[upcomingMission]}
        pendingBookings={[pendingApplication]}
        bookingsError={null}
        matchingMissions={[]}
        availableMissionsError={null}
        nextMission={upcomingMission}
        recentReviews={[]}
        recentReviewsError={null}
        isAvailable
        trustProfile={trustProfile}
        services={[service, draftService]}
        servicesError={null}
        deskRequests={[deskRequest]}
        deskRequestsError={null}
        upcomingMissions={1}
        pendingApplications={1}
        pendingServiceRequests={1}
        activeServices={1}
        openDeskRequests={1}
        averageRating={4.5}
      />,
    );

    expect(
      screen.getByText(/pilotez vos missions de renfort, vos services et vos échanges avec l'équipe/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /explorer missions & services/i })).toHaveAttribute(
      "href",
      "/marketplace",
    );
    expect(screen.getByRole("link", { name: /proposer mes services/i })).toHaveAttribute(
      "href",
      "/dashboard/ateliers",
    );

    expect(screen.getByRole("link", { name: /missions à venir/i })).toHaveAttribute(
      "href",
      "/bookings",
    );
    expect(screen.getByRole("link", { name: /candidatures en attente/i })).toHaveAttribute(
      "href",
      "/bookings",
    );
    expect(screen.getByRole("link", { name: /services à traiter/i })).toHaveAttribute(
      "href",
      "/dashboard/ateliers",
    );
    expect(screen.getByRole("link", { name: /note moyenne/i })).toHaveAttribute(
      "href",
      "/account",
    );
    expect(screen.getByText(/note moyenne/i)).toBeInTheDocument();
    expect(screen.queryByText(/missions ce mois/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/services actifs/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ca ce mois/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\+12%/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/profil complété/i)).not.toBeInTheDocument();

    expect(screen.getByRole("heading", { name: /mes services/i })).toBeInTheDocument();
    expect(screen.getByText(/missions disponibles/i)).toBeInTheDocument();
    expect(screen.queryByText(/correspondant à votre profil/i)).not.toBeInTheDocument();
    expect(screen.getByText(/1 brouillon à finaliser/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /gérer mes services/i })).toHaveAttribute(
      "href",
      "/dashboard/ateliers",
    );
    expect(screen.getByText("à traiter")).toBeInTheDocument();
    expect(
      screen.getByText("à traiter").parentElement?.querySelector("p.text-2xl"),
    ).toHaveTextContent("1");

    expect(screen.getByRole("heading", { name: /mes demandes/i })).toBeInTheDocument();
    expect(screen.getByText(/dernière demande : renfort éducateur spécialisé/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /voir mes demandes/i })).toHaveAttribute(
      "href",
      "/dashboard/demandes",
    );

    expect(screen.queryByText(/voir les missions/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/total gagné/i)).not.toBeInTheDocument();
  });

  it("transmet le profil de confiance reçu au TrustChecklistWidget", () => {
    const dynamicTrustProfile: FreelanceTrustProfile = {
      progress: 13,
      completedCount: 1,
      totalCount: 8,
      steps: [
        { id: "identity", label: "Identité API", status: "COMPLETED" },
        { id: "bio", label: "Bio API", status: "MISSING", actionLabel: "Compléter", href: "/account" },
        { id: "skills", label: "Compétences API", status: "MISSING", actionLabel: "Compléter", href: "/account" },
        { id: "phone", label: "Téléphone API", status: "MISSING", actionLabel: "Compléter", href: "/account" },
        { id: "siret", label: "SIRET API", status: "MISSING", actionLabel: "Compléter", href: "/account" },
        { id: "location", label: "Localisation API", status: "MISSING", actionLabel: "Compléter", href: "/account" },
        { id: "availableDays", label: "Jours API", status: "MISSING", actionLabel: "Compléter", href: "/account" },
        { id: "availability", label: "Disponibilité API", status: "MISSING", actionLabel: "Activer", href: "/account" },
      ],
    };

    render(
      <FreelanceDashboard
        confirmedBookings={[]}
        pendingBookings={[]}
        bookingsError={null}
        matchingMissions={[]}
        availableMissionsError={null}
        nextMission={undefined}
        recentReviews={[]}
        recentReviewsError={null}
        isAvailable={false}
        trustProfile={dynamicTrustProfile}
        services={[]}
        servicesError={null}
        deskRequests={[]}
        deskRequestsError={null}
        upcomingMissions={0}
        pendingApplications={0}
        pendingServiceRequests={0}
        activeServices={0}
        openDeskRequests={0}
        averageRating={null}
      />,
    );

    expect(trustChecklistWidgetSpy).toHaveBeenCalledWith({
      trustProfile: dynamicTrustProfile,
    });
  });

  it("affiche le type de demande Desk quand aucun contexte n'est lié", () => {
    render(
      <FreelanceDashboard
        confirmedBookings={[]}
        pendingBookings={[]}
        bookingsError={null}
        matchingMissions={[]}
        availableMissionsError={null}
        nextMission={undefined}
        recentReviews={[]}
        recentReviewsError={null}
        isAvailable
        trustProfile={trustProfile}
        services={[]}
        servicesError={null}
        deskRequests={[{ ...deskRequest, type: "TECHNICAL_ISSUE", mission: null, booking: null }]}
        deskRequestsError={null}
        upcomingMissions={0}
        pendingApplications={0}
        pendingServiceRequests={0}
        activeServices={0}
        openDeskRequests={1}
        averageRating={null}
      />,
    );

    expect(screen.getByText(/dernière demande : problème technique/i)).toBeInTheDocument();
    expect(screen.queryByText(/dernière demande : —/i)).not.toBeInTheDocument();
  });

  it("affiche le contexte booking d'une demande Desk récente", () => {
    render(
      <FreelanceDashboard
        confirmedBookings={[]}
        pendingBookings={[]}
        bookingsError={null}
        matchingMissions={[]}
        availableMissionsError={null}
        nextMission={undefined}
        recentReviews={[]}
        recentReviewsError={null}
        isAvailable
        trustProfile={trustProfile}
        services={[]}
        servicesError={null}
        deskRequests={[
          {
            ...deskRequest,
            type: "BOOKING_FAILURE",
            mission: null,
            booking: {
              id: "booking-1",
              status: "PENDING",
              paymentStatus: "UNPAID",
              reliefMission: null,
              service: { title: "Atelier mémoire" },
            },
          },
        ]}
        deskRequestsError={null}
        upcomingMissions={0}
        pendingApplications={0}
        pendingServiceRequests={0}
        activeServices={0}
        openDeskRequests={1}
        averageRating={null}
      />,
    );

    expect(screen.getByText(/dernière demande : atelier mémoire/i)).toBeInTheDocument();
  });

  it("ne parle de profil que lorsqu'une mission a un score positif", () => {
    render(
      <FreelanceDashboard
        confirmedBookings={[]}
        pendingBookings={[]}
        bookingsError={null}
        matchingMissions={[
          {
            id: "matched-mission",
            title: "Éducateur spécialisé",
            establishment: "EHPAD B",
            city: "Lyon",
            matchScore: 40,
            matchReasons: ["Même ville"],
          },
        ]}
        availableMissionsError={null}
        nextMission={undefined}
        recentReviews={[]}
        recentReviewsError={null}
        isAvailable
        trustProfile={trustProfile}
        services={[]}
        servicesError={null}
        deskRequests={[]}
        deskRequestsError={null}
        upcomingMissions={0}
        pendingApplications={0}
        pendingServiceRequests={0}
        activeServices={0}
        openDeskRequests={0}
        averageRating={null}
      />,
    );

    expect(screen.getByText(/sélectionnées pour votre profil/i)).toBeInTheDocument();
  });

  it("garde le sous-titre missions disponibles quand aucun score positif n'existe", () => {
    render(
      <FreelanceDashboard
        confirmedBookings={[]}
        pendingBookings={[]}
        bookingsError={null}
        matchingMissions={[
          {
            id: "available-mission",
            title: "Mission disponible",
            establishment: "EHPAD B",
            city: "Lyon",
            matchScore: 0,
            matchReasons: [],
          },
        ]}
        availableMissionsError={null}
        nextMission={undefined}
        recentReviews={[]}
        recentReviewsError={null}
        isAvailable
        trustProfile={trustProfile}
        services={[]}
        servicesError={null}
        deskRequests={[]}
        deskRequestsError={null}
        upcomingMissions={0}
        pendingApplications={0}
        pendingServiceRequests={0}
        activeServices={0}
        openDeskRequests={0}
        averageRating={null}
      />,
    );

    expect(screen.getByText(/missions disponibles/i)).toBeInTheDocument();
    expect(screen.queryByText(/sélectionnées pour votre profil/i)).not.toBeInTheDocument();
  });

  it("n'affiche pas la carte prochaine mission quand aucune mission future n'est fournie", () => {
    render(
      <FreelanceDashboard
        confirmedBookings={[]}
        pendingBookings={[]}
        bookingsError={null}
        matchingMissions={[]}
        availableMissionsError={null}
        nextMission={undefined}
        recentReviews={[]}
        recentReviewsError={null}
        isAvailable
        trustProfile={trustProfile}
        services={[]}
        servicesError={null}
        deskRequests={[]}
        deskRequestsError={null}
        upcomingMissions={0}
        pendingApplications={0}
        pendingServiceRequests={0}
        activeServices={0}
        openDeskRequests={0}
        averageRating={null}
      />,
    );

    expect(screen.queryByText("Prochaine mission")).not.toBeInTheDocument();
  });
});
