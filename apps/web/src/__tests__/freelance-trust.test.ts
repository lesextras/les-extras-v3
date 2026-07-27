import { describe, expect, it } from "vitest";
import type { UserProfile } from "@/app/actions/user";
import { computeFreelanceTrustProfile } from "@/lib/freelance-trust";

const baseUser: UserProfile = {
  id: "user-1",
  email: "freelance@example.com",
  role: "FREELANCE",
  status: "ACTIVE",
  onboardingStep: 3,
  isAvailable: true,
  createdAt: "2026-04-26T10:00:00.000Z",
  profile: {
    id: "profile-1",
    firstName: "Nora",
    lastName: "Martin",
    companyName: null,
    jobTitle: "Educatrice specialisee",
    bio: "Bio claire",
    skills: ["ecoute", "animation"],
    availableDays: ["MONDAY", "TUESDAY"],
    address: "12 rue des Lilas",
    city: "Lyon",
    zipCode: "69000",
    phone: "0601020304",
    siret: "12345678901234",
    tvaNumber: null,
    availableCredits: 0,
  },
};

describe("computeFreelanceTrustProfile", () => {
  it("calcule un profil complet uniquement a partir des donnees utilisateur reelles", () => {
    const trustProfile = computeFreelanceTrustProfile(baseUser);

    expect(trustProfile.progress).toBe(100);
    expect(trustProfile.completedCount).toBe(8);
    expect(trustProfile.totalCount).toBe(8);
    expect(trustProfile.steps.every((step) => step.status === "COMPLETED")).toBe(true);
  });

  it("signale les champs manquants sans inventer d'etapes documentaires", () => {
    const trustProfile = computeFreelanceTrustProfile({
      ...baseUser,
      isAvailable: false,
      profile: {
        ...baseUser.profile!,
        firstName: "Nora",
        lastName: "",
        bio: null,
        skills: [],
        phone: null,
        siret: null,
        city: "Lyon",
        address: null,
        availableDays: [],
      },
    });

    expect(trustProfile.progress).toBe(0);
    expect(trustProfile.completedCount).toBe(0);
    expect(trustProfile.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "identity", status: "PENDING", href: "/account" }),
        expect.objectContaining({ id: "location", status: "PENDING", href: "/account" }),
        expect.objectContaining({ id: "availability", status: "MISSING", actionLabel: "Activer" }),
      ]),
    );
    expect(trustProfile.steps.map((step) => step.label)).not.toEqual(
      expect.arrayContaining(["Pièce d'identité", "Diplômes"]),
    );
  });

  it("retourne un etat encourageant quand le profil est vide", () => {
    const trustProfile = computeFreelanceTrustProfile(null);

    expect(trustProfile.progress).toBe(0);
    expect(trustProfile.completedCount).toBe(0);
    expect(trustProfile.totalCount).toBe(8);
    expect(trustProfile.steps.every((step) => step.status === "MISSING")).toBe(true);
  });

  it("marque les competences comme manquantes quand elles sont absentes", () => {
    const trustProfile = computeFreelanceTrustProfile({
      ...baseUser,
      profile: {
        ...baseUser.profile!,
        skills: undefined as unknown as string[],
      },
    });

    expect(trustProfile.progress).toBe(88);
    expect(trustProfile.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "skills",
          label: "Compétences renseignées",
          status: "MISSING",
          actionLabel: "Compléter",
          href: "/account",
        }),
      ]),
    );
  });

  it("marque la disponibilite comme manquante quand la donnee est absente", () => {
    const trustProfile = computeFreelanceTrustProfile({
      ...baseUser,
      isAvailable: undefined as unknown as boolean,
    });

    expect(trustProfile.progress).toBe(88);
    expect(trustProfile.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "availability",
          label: "Profil ouvert aux missions",
          status: "MISSING",
          actionLabel: "Activer",
          href: "/account",
        }),
      ]),
    );
  });

  it("n'ajoute pas d'etape document quand aucune donnee document n'est disponible", () => {
    const trustProfile = computeFreelanceTrustProfile(baseUser);

    expect(trustProfile.steps.map((step) => step.id)).toEqual([
      "identity",
      "bio",
      "skills",
      "phone",
      "siret",
      "location",
      "availableDays",
      "availability",
    ]);
    expect(trustProfile.steps.map((step) => step.label).join(" ")).not.toMatch(
      /pièce|identité vérifiée|diplôme|document/i,
    );
  });
});
