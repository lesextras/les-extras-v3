import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RenfortsEmptyState } from "@/components/dashboard/establishment/RenfortsEmptyState";

const mockOpenRenfortModal = vi.fn();

vi.mock("@/lib/stores/useUIStore", () => ({
  useUIStore: (selector: (s: { openRenfortModal: () => void }) => unknown) =>
    selector({ openRenfortModal: mockOpenRenfortModal }),
}));

describe("RenfortsEmptyState", () => {
  it("affiche le titre 'Aucune mission en cours'", () => {
    render(<RenfortsEmptyState />);
    expect(screen.getByText(/aucune mission en cours/i)).toBeInTheDocument();
  });

  it("affiche la description", () => {
    render(<RenfortsEmptyState />);
    expect(screen.getByText(/demande de renfort active/i)).toBeInTheDocument();
  });

  it("affiche le bouton 'Publier un renfort'", () => {
    render(<RenfortsEmptyState />);
    expect(screen.getByRole("button", { name: /publier un renfort/i })).toBeInTheDocument();
  });

  it("appelle openRenfortModal au clic du bouton", () => {
    render(<RenfortsEmptyState />);
    fireEvent.click(screen.getByRole("button", { name: /publier un renfort/i }));
    expect(mockOpenRenfortModal).toHaveBeenCalledTimes(1);
  });
});
