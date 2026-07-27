import { describe, expect, it } from "vitest";
import type { EstablishmentMission } from "@/app/actions/missions";
import type { UserProfile } from "@/app/actions/user";
import { computeEstablishmentTrustProfile } from "@/lib/establishment-trust";

const baseUser: UserProfile = {
  id: "establishment-1",
  email: "contact@example.com",
  role: "ESTABLISHMENT",
  status: "ACTIVE",
  onboardingStep: 3,
  isAvailable: false,
  createdAt: "2026-04-26T10:00:00.000Z",
  profile: {
    id: "profile-1",
    firstName: "",
    lastName: "",
    companyName: null,
    jobTitle: null,
    bio: null,
    skills: [],
    availableDays: [],
    address: null,
    city: null,
    zipCode: null,
    phone: null,
    siret: null,
    tvaNumber: null,
    availableCredits: 0,
  },
};

const publishedMission: EstablishmentMission = {
  id: "mission-1",
  title: "Renfort éducateur",
  dateStart: "2099-01-02T10:00:00.000Z",
  dateEnd: "2099-01-02T18:00:00.000Z",
  address: "Lyon",
  hourlyRate: 28,
  status: "OPEN",
  isRenfort: true,
  city: "Lyon",
  bookings: [],
};

describe("computeEstablishmentTrustProfile", () => {
  it("retourne une progression faible quand le profil est vide", () => {
    const trustProfile = computeEstablishmentTrustProfile(baseUser, []);

    expect(trustProfile.progress).toBe(0);
    expect(trustProfile.completedCount).toBe(0);
    expect(trustProfile.totalCount).toBe(6);
    expect(trustProfile.steps.every((step) => step.status === "MISSING")).toBe(true);
  });

  it("augmente la progression avec les champs établissement réels", () => {
    const trustProfile = computeEstablishmentTrustProfile(
      {
        ...baseUser,
        profile: {
          ...baseUser.profile!,
          companyName: "Les Jardins Bleus",
          bio: "Structure médico-sociale à Lyon.",
          phone: "0601020304",
          address: "12 rue des Lilas",
        },
      },
      [],
    );

    expect(trustProfile.progress).toBe(33);
    expect(trustProfile.completedCount).toBe(2);
    expect(trustProfile.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "companyName", status: "COMPLETED" }),
        expect.objectContaining({ id: "bio", status: "COMPLETED" }),
        expect.objectContaining({ id: "contact", status: "PENDING" }),
      ]),
    );
  });

  it("marque le SIRET comme renseigné sans promettre de vérification", () => {
    const trustProfile = computeEstablishmentTrustProfile(
      {
        ...baseUser,
        profile: {
          ...baseUser.profile!,
          siret: "12345678901234",
        },
      },
      [],
    );

    expect(trustProfile.progress).toBe(17);
    expect(trustProfile.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "siret",
          label: "SIRET renseigné",
          status: "COMPLETED",
        }),
      ]),
    );
    expect(trustProfile.steps.map((step) => step.label).join(" ")).not.toMatch(/SIRET vérifié/i);
  });

  it("complète l'étape premier renfort publié quand une mission réelle existe", () => {
    const trustProfile = computeEstablishmentTrustProfile(baseUser, [publishedMission]);

    expect(trustProfile.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "firstRenfort",
          label: "Premier renfort publié",
          status: "COMPLETED",
        }),
      ]),
    );
  });

  it("n'affiche aucun champ fictif comme logo, avatar ou document vérifié", () => {
    const trustProfile = computeEstablishmentTrustProfile(baseUser, []);
    const labels = trustProfile.steps.map((step) => step.label).join(" ");
    const ids = trustProfile.steps.map((step) => step.id);

    expect(ids).toEqual([
      "companyName",
      "bio",
      "contact",
      "siret",
      "firstRenfort",
      "credits",
    ]);
    expect(labels).not.toMatch(/logo|avatar|vérifié|document/i);
  });

  it("arrondit correctement la progression", () => {
    const trustProfile = computeEstablishmentTrustProfile(
      {
        ...baseUser,
        profile: {
          ...baseUser.profile!,
          companyName: "Les Jardins Bleus",
        },
      },
      [],
    );

    expect(trustProfile.progress).toBe(17);
  });
});
