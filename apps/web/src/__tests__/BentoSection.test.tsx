import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { HTMLAttributes, ReactNode } from "react";
import { BentoItem, BentoSection } from "@/components/layout/BentoSection";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => {
      const {
        variants,
        initial,
        whileInView,
        viewport,
        animate,
        transition,
        whileHover,
        ...domProps
      } = props as HTMLAttributes<HTMLDivElement> & Record<string, unknown>;

      void variants;
      void initial;
      void whileInView;
      void viewport;
      void animate;
      void transition;
      void whileHover;

      return <div {...domProps}>{children}</div>;
    },
  },
}));

describe("BentoSection", () => {
  it("applique le span sur le vrai wrapper de grille via BentoItem", () => {
    render(
      <BentoSection cols={3}>
        <BentoItem span={2}>
          <div data-testid="wide-widget">Large</div>
        </BentoItem>
        <div data-testid="regular-widget">Normal</div>
      </BentoSection>,
    );

    expect(screen.getByTestId("wide-widget").parentElement).toHaveClass("md:col-span-2");
    expect(screen.getByTestId("regular-widget").parentElement).not.toHaveClass("md:col-span-2");
  });

  it("applique le span 3 en md puis lg sur le wrapper de grille", () => {
    render(
      <BentoSection cols={3}>
        <BentoItem span={3}>
          <div data-testid="full-widget">Très large</div>
        </BentoItem>
      </BentoSection>,
    );

    expect(screen.getByTestId("full-widget").parentElement).toHaveClass(
      "md:col-span-2",
      "lg:col-span-3",
    );
  });
});
