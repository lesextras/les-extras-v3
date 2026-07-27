import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextMissionCard } from "@/components/dashboard/NextMissionCard";

describe("NextMissionCard", () => {
  it("pointe vers le lien de détail canonique fourni", () => {
    render(
      <NextMissionCard
        detailsHref="/bookings/MISSION/line-42"
        title="Mission infirmier"
        establishment="EHPAD Test"
        city="Paris"
        scheduledAt="2026-03-20T09:00:00.000Z"
        dateDisplay="Vendredi 20 mars"
        timeRange="08:00-16:00"
      />,
    );

    expect(screen.getByRole("link", { name: /voir les détails/i })).toHaveAttribute(
      "href",
      "/bookings/MISSION/line-42",
    );
  });
});
