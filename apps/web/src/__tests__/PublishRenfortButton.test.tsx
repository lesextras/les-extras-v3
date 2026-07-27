import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PublishRenfortButton } from "@/components/dashboard/establishment/PublishRenfortButton";

const mockOpenRenfortModal = vi.fn();

vi.mock("@/lib/stores/useUIStore", () => ({
  useUIStore: (selector: (s: { openRenfortModal: () => void }) => unknown) =>
    selector({ openRenfortModal: mockOpenRenfortModal }),
}));

describe("PublishRenfortButton", () => {
  it("affiche le label par défaut 'Publier un renfort'", () => {
    render(<PublishRenfortButton />);
    expect(screen.getByRole("button", { name: /publier un renfort/i })).toBeInTheDocument();
  });

  it("affiche le label personnalisé quand fourni", () => {
    render(<PublishRenfortButton label="Nouveau renfort" />);
    expect(screen.getByRole("button", { name: /nouveau renfort/i })).toBeInTheDocument();
  });

  it("appelle openRenfortModal au clic", () => {
    render(<PublishRenfortButton />);
    fireEvent.click(screen.getByRole("button", { name: /publier un renfort/i }));
    expect(mockOpenRenfortModal).toHaveBeenCalledTimes(1);
  });
});
