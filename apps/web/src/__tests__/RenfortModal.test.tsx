import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { RenfortModal } from "@/components/modals/RenfortModal";
import { useUIStore } from "@/lib/stores/useUIStore";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
const mockCreateMissionFromRenfort = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h1>{children}</h1>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}));

vi.mock("@/components/ui/switch", () => ({
  Switch: ({
    checked,
    onCheckedChange,
  }: {
    checked: boolean;
    onCheckedChange?: (checked: boolean) => void;
  }) => (
    <button type="button" onClick={() => onCheckedChange?.(!checked)}>
      {checked ? "On" : "Off"}
    </button>
  ),
}));

vi.mock("@/components/ui/select", async () => {
  const ReactModule = await import("react");
  const SelectContext = ReactModule.createContext<{
    value?: string;
    onValueChange?: (value: string) => void;
  }>({});

  return {
    Select: ({
      value,
      onValueChange,
      children,
    }: {
      value?: string;
      onValueChange?: (value: string) => void;
      children: React.ReactNode;
    }) => (
      <SelectContext.Provider value={{ value, onValueChange }}>
        <div>{children}</div>
      </SelectContext.Provider>
    ),
    SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectValue: ({ placeholder }: { placeholder?: string }) => {
      const context = ReactModule.useContext(SelectContext);
      return <span>{context.value ?? placeholder ?? ""}</span>;
    },
    SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => {
      const context = ReactModule.useContext(SelectContext);
      return (
        <button type="button" onClick={() => context.onValueChange?.(value)}>
          {children}
        </button>
      );
    },
  };
});

vi.mock("@/app/actions/marketplace", () => ({
  createMissionFromRenfort: (...args: unknown[]) => mockCreateMissionFromRenfort(...args),
}));

vi.mock("@/lib/stores/useUIStore", async () => {
  const { create } = await import("zustand");

  type MockState = {
    isRenfortModalOpen: boolean;
    renfortStep: number;
    renfortStepDir: number;
    openRenfortModal: () => void;
    closeRenfortModal: () => void;
    setRenfortStep: (step: number) => void;
    setRenfortStepDir: (dir: number) => void;
  };

  const useUIStore = create<MockState>((set) => ({
    isRenfortModalOpen: true,
    renfortStep: 0,
    renfortStepDir: 1,
    openRenfortModal: () => set({ isRenfortModalOpen: true }),
    closeRenfortModal: () => set({ isRenfortModalOpen: false, renfortStep: 0 }),
    setRenfortStep: (step) => set({ renfortStep: step }),
    setRenfortStepDir: (dir) => set({ renfortStepDir: dir }),
  }));

  return { useUIStore };
});

function resetStore() {
  useUIStore.setState({
    isRenfortModalOpen: true,
    renfortStep: 0,
    renfortStepDir: 1,
  });
}

function addDaysFromNow(offset: number): Date {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
}

function toInputDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function renderPlanningStep() {
  useUIStore.setState({
    isRenfortModalOpen: true,
    renfortStep: 2,
    renfortStepDir: 1,
  });

  const view = render(<RenfortModal />);

  await waitFor(() => {
    expect(screen.getByText(/renseignez chaque plage avec un vrai début/i)).toBeInTheDocument();
  });

  return view;
}

async function reachPlanningStep() {
  const view = render(<RenfortModal />);

  fireEvent.click(screen.getByRole("button", { name: /psychologue/i }));
  fireEvent.click(screen.getByRole("button", { name: /suivant/i }));

  await waitFor(() => {
    expect(screen.getByText(/type d'établissement/i)).toBeInTheDocument();
  });

  fireEvent.click(screen.getByText("EHPAD"));
  fireEvent.click(screen.getByRole("button", { name: /personnes âgées/i }));
  fireEvent.click(screen.getByRole("button", { name: /suivant/i }));

  await waitFor(() => {
    expect(screen.getByText(/renseignez chaque plage avec un vrai début/i)).toBeInTheDocument();
  });

  return view;
}

function fillPlanningSlot(
  container: HTMLElement,
  slotIndex: number,
  values: { dateStart: string; dateEnd?: string; heureDebut: string; heureFin: string },
) {
  const dateInputs = container.querySelectorAll<HTMLInputElement>('input[type="date"]');
  const timeInputs = container.querySelectorAll<HTMLInputElement>('input[type="time"]');

  fireEvent.change(dateInputs[slotIndex * 2]!, { target: { value: values.dateStart } });
  fireEvent.change(dateInputs[slotIndex * 2 + 1]!, {
    target: { value: values.dateEnd ?? values.dateStart },
  });
  fireEvent.change(timeInputs[slotIndex * 2]!, { target: { value: values.heureDebut } });
  fireEvent.change(timeInputs[slotIndex * 2 + 1]!, { target: { value: values.heureFin } });
}

async function reachRecapStep(container: HTMLElement) {
  fireEvent.click(screen.getByRole("button", { name: /suivant/i }));
  await waitFor(() => {
    expect(screen.getByText(/type de poste/i)).toBeInTheDocument();
  });

  fireEvent.click(screen.getByRole("button", { name: /suivant/i }));
  await waitFor(() => {
    expect(screen.getByLabelText(/adresse complète/i)).toBeInTheDocument();
  });

  fireEvent.change(screen.getByLabelText(/adresse complète/i), {
    target: { value: "12 rue des Lilas" },
  });
  fireEvent.change(screen.getByLabelText(/code postal/i), {
    target: { value: "69003" },
  });
  fireEvent.change(screen.getByLabelText(/ville/i), {
    target: { value: "Lyon" },
  });
  fireEvent.click(screen.getByRole("button", { name: /suivant/i }));

  await waitFor(() => {
    expect(screen.getByText(/vérifiez les informations/i)).toBeInTheDocument();
  });

  return container.textContent ?? "";
}

describe("RenfortModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
    mockCreateMissionFromRenfort.mockResolvedValue({ ok: true });
  });

  it("affiche uniquement les catégories et métiers V1 validés", () => {
    render(<RenfortModal />);

    expect(screen.getByText("Soin")).toBeInTheDocument();
    expect(screen.getByText("Éducatif")).toBeInTheDocument();
    expect(screen.getByText("Support")).toBeInTheDocument();

    [
      "Psychologue",
      "Auxiliaire de vie",
      "Art thérapeute",
      "Éducateur spécialisé",
      "Moniteur éducateur",
      "Éducateur sportif",
      "Surveillant de nuit",
      "Maîtresse de maison",
      "Agent de service",
      "Cuisinier",
      "Autre métier",
    ].forEach((label) => {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    });

    expect(screen.queryByText("Soin psychique / relationnel")).not.toBeInTheDocument();
    expect(screen.queryByText("Éducatif / accompagnement")).not.toBeInTheDocument();
    expect(screen.queryByText("Animation / formation")).not.toBeInTheDocument();

    ["Psychomotricien", "Sophrologue", "Formateur", "Intervenant bien-être"].forEach((label) => {
      expect(screen.queryByRole("button", { name: label })).not.toBeInTheDocument();
    });
  }, 10000);

  it("affiche des choix de publication clairs", async () => {
    await renderPlanningStep();

    const batchButton = screen.getByRole("button", {
      name: /créer plusieurs missions indépendantes/i,
    });
    const singleBookingButton = screen.getByRole("button", {
      name: /créer une seule mission sur plusieurs plages/i,
    });

    expect(batchButton).toHaveAttribute("aria-pressed", "true");
    expect(singleBookingButton).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Chaque plage devient une mission séparée.")).toBeInTheDocument();
    expect(screen.getByText("Un seul intervenant couvre toutes les plages.")).toBeInTheDocument();
    expect(screen.queryByText(/Créer plusieurs missions d'un jour/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Créer une mission de plusieurs jours/i)).not.toBeInTheDocument();
  });

  it("bloque un créneau déjà passé", async () => {
    const { container } = await renderPlanningStep();

    fillPlanningSlot(container, 0, {
      dateStart: toInputDate(addDaysFromNow(-1)),
      heureDebut: "08:00",
      heureFin: "12:00",
    });

    fireEvent.click(screen.getByRole("button", { name: /suivant/i }));

    await waitFor(() => {
      expect(screen.getByText(/déjà passé/i)).toBeInTheDocument();
    });
    expect(useUIStore.getState().renfortStep).toBe(2);
  });

  it("bloque des créneaux qui se chevauchent", async () => {
    const { container } = await renderPlanningStep();

    fillPlanningSlot(container, 0, {
      dateStart: toInputDate(addDaysFromNow(10)),
      heureDebut: "08:00",
      heureFin: "12:00",
    });

    fireEvent.click(screen.getByRole("button", { name: /ajouter un jour/i }));
    fillPlanningSlot(container, 1, {
      dateStart: toInputDate(addDaysFromNow(10)),
      heureDebut: "11:00",
      heureFin: "14:00",
    });

    fireEvent.click(screen.getByRole("button", { name: /suivant/i }));

    await waitFor(() => {
      expect(screen.getByText(/chevauche une autre plage/i)).toBeInTheDocument();
    });
    expect(useUIStore.getState().renfortStep).toBe(2);
  });

  it("accepte une plage overnight et soumet une seule mission sur plusieurs plages", async () => {
    const { container } = await reachPlanningStep();
    const startDay = addDaysFromNow(14);
    const endDay = addDaysFromNow(15);

    const singleBookingButton = screen.getByRole("button", {
      name: /créer une seule mission sur plusieurs plages/i,
    });
    fireEvent.click(singleBookingButton);
    expect(singleBookingButton).toHaveAttribute("aria-pressed", "true");

    fillPlanningSlot(container, 0, {
      dateStart: toInputDate(startDay),
      dateEnd: toInputDate(endDay),
      heureDebut: "21:00",
      heureFin: "07:00",
    });

    const recapText = await reachRecapStep(container);
    expect(recapText).toContain("1 mission sur plusieurs plages");
    fireEvent.click(screen.getByRole("button", { name: /publier le sos/i }));

    await waitFor(() => {
      expect(mockCreateMissionFromRenfort).toHaveBeenCalledWith(
        expect.objectContaining({
          publicationMode: "MULTI_DAY_SINGLE_BOOKING",
          planning: [
            {
              dateStart: toInputDate(startDay),
              heureDebut: "21:00",
              dateEnd: toInputDate(endDay),
              heureFin: "07:00",
            },
          ],
          dateStart: new Date(`${toInputDate(startDay)}T21:00`).toISOString(),
          dateEnd: new Date(`${toInputDate(endDay)}T07:00`).toISOString(),
        }),
      );
    });

    const submittedPayload = mockCreateMissionFromRenfort.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(submittedPayload).not.toHaveProperty("slots");
  }, 10000);

  it("trie les créneaux dans le récapitulatif et à l'envoi", async () => {
    const { container } = await reachPlanningStep();
    const laterDay = addDaysFromNow(12);
    const earlierDay = addDaysFromNow(10);
    const batchButton = screen.getByRole("button", {
      name: /créer plusieurs missions indépendantes/i,
    });

    expect(batchButton).toHaveAttribute("aria-pressed", "true");

    fillPlanningSlot(container, 0, {
      dateStart: toInputDate(laterDay),
      heureDebut: "14:00",
      heureFin: "18:00",
    });

    fireEvent.click(screen.getByRole("button", { name: /ajouter un jour/i }));
    fillPlanningSlot(container, 1, {
      dateStart: toInputDate(earlierDay),
      heureDebut: "08:00",
      heureFin: "12:00",
    });

    const recapText = await reachRecapStep(container);
    expect(recapText).toContain("2 mission(s) séparée(s)");

    const earlierLabel = format(new Date(`${toInputDate(earlierDay)}T08:00`), "EEE d MMM yyyy", {
      locale: fr,
    });
    const laterLabel = format(new Date(`${toInputDate(laterDay)}T14:00`), "EEE d MMM yyyy", {
      locale: fr,
    });

    expect(recapText.indexOf(earlierLabel)).toBeLessThan(recapText.indexOf(laterLabel));

    fireEvent.click(screen.getByRole("button", { name: /publier le sos/i }));

    await waitFor(() => {
      expect(mockCreateMissionFromRenfort).toHaveBeenCalledWith(
        expect.objectContaining({
          publicationMode: "MULTI_MISSION_BATCH",
          planning: [
            {
              dateStart: toInputDate(earlierDay),
              heureDebut: "08:00",
              dateEnd: toInputDate(earlierDay),
              heureFin: "12:00",
            },
            {
              dateStart: toInputDate(laterDay),
              heureDebut: "14:00",
              dateEnd: toInputDate(laterDay),
              heureFin: "18:00",
            },
          ],
          dateStart: new Date(`${toInputDate(earlierDay)}T08:00`).toISOString(),
          dateEnd: new Date(`${toInputDate(laterDay)}T18:00`).toISOString(),
        }),
      );
      expect(mockPush).toHaveBeenCalledWith("/dashboard/renforts");
      expect(mockRefresh).toHaveBeenCalled();
    });

    const submittedPayload = mockCreateMissionFromRenfort.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(submittedPayload).not.toHaveProperty("slots");
  }, 10000);

  it("soumet un métier, une compétence et un public libres sans doublons", async () => {
    const { container } = render(<RenfortModal />);
    const startDay = addDaysFromNow(16);

    fireEvent.click(screen.getByRole("button", { name: /autre métier/i }));
    fireEvent.change(screen.getByLabelText(/précisez le métier recherché/i), {
      target: { value: "  Médiateur familial  " },
    });
    fireEvent.change(screen.getByLabelText(/ajouter une compétence/i), {
      target: { value: " A " },
    });
    fireEvent.click(screen.getByRole("button", { name: /^ajouter$/i }));
    fireEvent.change(screen.getByLabelText(/ajouter une compétence/i), {
      target: { value: " Approche systémique " },
    });
    fireEvent.click(screen.getByRole("button", { name: /^ajouter$/i }));
    fireEvent.change(screen.getByLabelText(/ajouter une compétence/i), {
      target: { value: "approche systémique" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^ajouter$/i }));
    fireEvent.click(screen.getByRole("button", { name: /suivant/i }));

    await waitFor(() => {
      expect(screen.getByText(/type d'établissement/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("IME"));
    fireEvent.change(screen.getByLabelText(/ajouter un public/i), {
      target: { value: " B " },
    });
    fireEvent.click(screen.getByRole("button", { name: /^ajouter$/i }));
    fireEvent.change(screen.getByLabelText(/ajouter un public/i), {
      target: { value: " Jeunes majeurs " },
    });
    fireEvent.click(screen.getByRole("button", { name: /^ajouter$/i }));
    fireEvent.click(screen.getByRole("button", { name: /suivant/i }));

    await waitFor(() => {
      expect(screen.getByText(/renseignez chaque plage avec un vrai début/i)).toBeInTheDocument();
    });

    fillPlanningSlot(container, 0, {
      dateStart: toInputDate(startDay),
      heureDebut: "09:00",
      heureFin: "14:00",
    });

    const recapText = await reachRecapStep(container);
    expect(recapText).toContain("Médiateur familial");
    expect(recapText).toContain("Approche systémique");
    expect(recapText).toContain("Jeunes majeurs");
    expect(recapText).toContain("Frais de fonctionnement 10 %");
    expect(recapText).toContain("Coût établissement TTC / h");
    expect(recapText).toContain("Montant total estimé TTC");
    expect(recapText).toContain("2,00 € / h");
    expect(recapText).toContain("22,00 € / h");
    expect(recapText).toContain("110,00 €");
    expect(recapText.toLocaleLowerCase("fr")).not.toContain("commission");

    fireEvent.click(screen.getByRole("button", { name: /publier le sos/i }));

    await waitFor(() => {
      expect(mockCreateMissionFromRenfort).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Médiateur familial",
          metier: "autre",
          requiredSkills: ["Approche systémique"],
          targetPublic: ["Jeunes majeurs"],
        }),
      );
    });
  }, 10000);

  it("affiche une erreur persistante et garde le modal ouvert si la publication échoue", async () => {
    mockCreateMissionFromRenfort.mockResolvedValueOnce({
      ok: false,
      error: "Le planning est invalide.",
    });

    const { container } = await reachPlanningStep();
    const startDay = addDaysFromNow(18);

    fillPlanningSlot(container, 0, {
      dateStart: toInputDate(startDay),
      heureDebut: "09:00",
      heureFin: "17:00",
    });

    await reachRecapStep(container);
    fireEvent.click(screen.getByRole("button", { name: /publier le sos/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Publication impossible");
      expect(screen.getByRole("alert")).toHaveTextContent("Le planning est invalide.");
    });
    expect(useUIStore.getState().isRenfortModalOpen).toBe(true);
    expect(mockPush).not.toHaveBeenCalled();
  }, 10000);
});
