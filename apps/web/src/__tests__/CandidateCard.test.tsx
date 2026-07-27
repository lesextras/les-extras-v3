import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CandidateCard } from "@/components/dashboard/establishment/CandidateCard";
import { toast } from "sonner";

const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: (...args: unknown[]) => mockRefresh(...args) }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const mockDeclineCandidate = vi.fn().mockResolvedValue({ ok: true });

vi.mock("@/app/actions/missions", () => ({
  declineCandidate: (...args: unknown[]) => mockDeclineCandidate(...args),
}));

const defaultFreelance = {
  id: "freelance-123",
  email: "jean@example.com",
  profile: {
    firstName: "Jean",
    lastName: "Dupont",
    avatar: null,
    jobTitle: "Infirmier",
  },
};

describe("CandidateCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("affiche le nom du freelance", () => {
    render(
      <CandidateCard
        bookingId="booking-1"
        freelance={defaultFreelance}
        status="PENDING"
      />,
    );
    expect(screen.getByText("Jean Dupont")).toBeInTheDocument();
  });

  it("n'affiche plus le bouton Accepter quand le statut est PENDING", () => {
    render(
      <CandidateCard
        bookingId="booking-1"
        freelance={defaultFreelance}
        status="PENDING"
      />,
    );
    expect(screen.queryByRole("button", { name: /accepter/i })).not.toBeInTheDocument();
  });

  it("affiche le bouton Décliner quand le statut est PENDING", () => {
    render(
      <CandidateCard
        bookingId="booking-1"
        freelance={defaultFreelance}
        status="PENDING"
      />,
    );
    expect(screen.getByRole("button", { name: /décliner/i })).toBeInTheDocument();
  });

  it("appelle declineCandidate avec le bon bookingId au clic Décliner", async () => {
    render(
      <CandidateCard
        bookingId="booking-xyz"
        freelance={defaultFreelance}
        status="PENDING"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /décliner/i }));
    await waitFor(() => {
      expect(mockDeclineCandidate).toHaveBeenCalledWith("booking-xyz");
    });
  });

  it("affiche 'Acceptée' sans boutons d'action quand le statut est CONFIRMED", () => {
    render(
      <CandidateCard
        bookingId="booking-1"
        freelance={defaultFreelance}
        status="CONFIRMED"
      />,
    );
    expect(screen.getByText(/acceptée/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /accepter/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /décliner/i })).not.toBeInTheDocument();
  });

  it("affiche le lien vers le profil du freelance", () => {
    render(
      <CandidateCard
        bookingId="booking-1"
        freelance={defaultFreelance}
        status="PENDING"
      />,
    );
    const profileLink = screen.getByRole("link", { name: /profil/i });
    expect(profileLink).toHaveAttribute("href", "/freelances/freelance-123");
  });

  it("affiche la motivation si fournie", () => {
    render(
      <CandidateCard
        bookingId="booking-1"
        freelance={defaultFreelance}
        status="PENDING"
        motivation="Très motivé pour cette mission"
      />,
    );
    expect(screen.getByText(/très motivé/i)).toBeInTheDocument();
  });

  it("affiche le taux horaire proposé si fourni", () => {
    render(
      <CandidateCard
        bookingId="booking-1"
        freelance={defaultFreelance}
        status="PENDING"
        proposedRate={35}
      />,
    );
    expect(screen.getByText(/35/)).toBeInTheDocument();
  });

  it("appelle toast.info('Candidature refusée.') après un refus réussi", async () => {
    mockDeclineCandidate.mockResolvedValue({ ok: true });
    render(
      <CandidateCard
        bookingId="booking-decline-1"
        freelance={defaultFreelance}
        status="PENDING"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /décliner/i }));
    await waitFor(() => {
      expect(toast.info).toHaveBeenCalledWith("Candidature refusée.");
    });
  });

  it("appelle router.refresh() après un refus réussi", async () => {
    mockDeclineCandidate.mockResolvedValue({ ok: true });
    render(
      <CandidateCard
        bookingId="booking-decline-2"
        freelance={defaultFreelance}
        status="PENDING"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /décliner/i }));
    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("affiche toast.error si le refus échoue", async () => {
    mockDeclineCandidate.mockResolvedValue({ ok: false, error: "Erreur réseau" });
    render(
      <CandidateCard
        bookingId="booking-decline-3"
        freelance={defaultFreelance}
        status="PENDING"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /décliner/i }));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Erreur",
        expect.objectContaining({ description: "Erreur réseau" }),
      );
    });
  });
});
