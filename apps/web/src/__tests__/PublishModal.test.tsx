import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { HTMLAttributes, ReactNode } from "react";
import { PublishModal } from "@/components/modals/PublishModal";

const mockOpenPublishModal = vi.fn();
const mockClosePublishModal = vi.fn();
const mockCreateServiceFromPublish = vi.fn();
const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock("@/lib/stores/useUIStore", () => ({
  useUIStore: (selector: (s: {
    isPublishModalOpen: boolean;
    openPublishModal: () => void;
    closePublishModal: () => void;
  }) => unknown) =>
    selector({
      isPublishModalOpen: true,
      openPublishModal: mockOpenPublishModal,
      closePublishModal: mockClosePublishModal,
    }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

vi.mock("@/app/actions/marketplace", () => ({
  createServiceFromPublish: (...args: unknown[]) => mockCreateServiceFromPublish(...args),
}));

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}));

async function advanceToPricing() {
  fireEvent.click(screen.getByRole("button", { name: /gestion des émotions/i }));
  fireEvent.click(screen.getByRole("button", { name: /suivant/i }));

  fireEvent.change(await screen.findByLabelText(/titre de/i), {
    target: { value: "Atelier gestion des émotions" },
  });
  fireEvent.change(screen.getByLabelText(/description générale/i), {
    target: { value: "Une description suffisamment détaillée pour valider le formulaire." },
  });
  fireEvent.click(screen.getByRole("button", { name: /suivant/i }));

  await screen.findByText(/ces sections sont optionnelles/i);
  fireEvent.click(screen.getByRole("button", { name: /suivant/i }));

  await screen.findByText(/public cible/i);
  fireEvent.click(screen.getByRole("button", { name: /^adultes$/i }));
  fireEvent.click(screen.getByRole("button", { name: /suivant/i }));

  await screen.findByText(/forfait séance/i);
}

async function advanceToSchedule() {
  await advanceToPricing();

  fireEvent.change(screen.getByLabelText(/tarif forfaitaire/i), {
    target: { value: "350" },
  });
  fireEvent.click(screen.getByRole("button", { name: /suivant/i }));

  await screen.findByText(/mode de planification/i);
}

async function fillSpecificSchedule(
  overrides?: { date?: string; start?: string; end?: string },
) {
  const futureDate =
    overrides?.date ??
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  await waitFor(() => {
    expect(document.querySelector('input[name="slots.0.date"]')).not.toBeNull();
  });

  const slotDateInput = document.querySelector('input[name="slots.0.date"]') as HTMLInputElement;
  const slotStartInput = document.querySelector('input[name="slots.0.heureDebut"]') as HTMLInputElement;
  const slotEndInput = document.querySelector('input[name="slots.0.heureFin"]') as HTMLInputElement;

  fireEvent.change(slotDateInput, { target: { value: futureDate } });
  fireEvent.change(slotStartInput, { target: { value: overrides?.start ?? "09:00" } });
  fireEvent.change(slotEndInput, { target: { value: overrides?.end ?? "11:00" } });

  return futureDate;
}

describe("PublishModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateServiceFromPublish.mockResolvedValue({ ok: true });
  });

  it("bloque l'étape tarif avec un message visible si le tarif par participant manque", async () => {
    render(<PublishModal />);

    await advanceToPricing();

    fireEvent.click(screen.getByRole("button", { name: /par participant/i }));
    fireEvent.click(screen.getByRole("button", { name: /suivant/i }));

    await waitFor(() => {
      expect(screen.getByText("Veuillez saisir un tarif par participant")).toBeInTheDocument();
    });
    expect(mockCreateServiceFromPublish).not.toHaveBeenCalled();
  }, 15000);

  it("bloque la publication avec un message visible si un créneau est invalide", async () => {
    render(<PublishModal />);

    await advanceToSchedule();
    await fillSpecificSchedule({ start: "11:00", end: "09:00" });

    fireEvent.click(screen.getByRole("button", { name: /publier l'atelier/i }));

    await waitFor(() => {
      expect(screen.getByText("L'heure de fin doit être après l'heure de début")).toBeInTheDocument();
    });
    expect(mockCreateServiceFromPublish).not.toHaveBeenCalled();
  }, 15000);

  it("publie une offre ACTIVE sur le flux actuel", async () => {
    render(<PublishModal />);

    await advanceToSchedule();
    const futureDate = await fillSpecificSchedule();

    fireEvent.click(screen.getByRole("button", { name: /publier l'atelier/i }));

    await waitFor(() => {
      expect(mockCreateServiceFromPublish).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Atelier gestion des émotions",
          type: "WORKSHOP",
          pricingType: "SESSION",
          price: 350,
          status: "ACTIVE",
          publicCible: ["ADULTES"],
          slots: [{ date: futureDate, heureDebut: "09:00", heureFin: "11:00" }],
        }),
      );
      expect(mockPush).toHaveBeenCalledWith("/marketplace");
      expect(mockRefresh).toHaveBeenCalled();
      expect(mockToastSuccess).toHaveBeenCalled();
    });
  }, 15000);

  it("enregistre un brouillon depuis le même formulaire", async () => {
    render(<PublishModal />);

    await advanceToSchedule();
    await fillSpecificSchedule();

    fireEvent.click(screen.getByRole("button", { name: /enregistrer en brouillon/i }));

    await waitFor(() => {
      expect(mockCreateServiceFromPublish).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "DRAFT",
        }),
      );
      expect(mockPush).toHaveBeenCalledWith("/dashboard/ateliers");
      expect(mockToastSuccess).toHaveBeenCalled();
    });
  }, 15000);
});
