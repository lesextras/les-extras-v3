import { describe, expect, it } from "vitest";
import type { UserProfile } from "@/app/actions/user";
import type { SerializedMission } from "@/app/actions/marketplace";
import { getTopMatchingMissions, scoreMissionForFreelance } from "@/lib/mission-matching";

const baseUser: UserProfile = {
  id: "free-1",
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
    jobTitle: "Éducatrice spécialisée",
    bio: "Accompagnement éducatif",
    skills: ["TSA / autisme", "Gestion de crise"],
    availableDays: ["Lun", "Mar"],
    address: "12 rue des Lilas",
    city: "Lyon",
    zipCode: "69000",
    phone: "0601020304",
    siret: "12345678901234",
    tvaNumber: null,
    availableCredits: 0,
  },
};

const baseMission: SerializedMission = {
  id: "mission-base",
  title: "Renfort éducateur spécialisé",
  dateStart: "2026-04-27T10:00:00.000Z",
  dateEnd: "2026-04-27T18:00:00.000Z",
  address: "Lyon",
  hourlyRate: 28,
  status: "OPEN",
  isRenfort: true,
  metier: "educateur-specialise",
  city: "Lyon",
  zipCode: "69000",
  requiredSkills: ["TSA / autisme"],
  diplomaRequired: false,
  isUrgent: true,
};

type Profile = NonNullable<UserProfile["profile"]>;

function createNeutralUser(profileOverrides: Partial<Profile> = {}): UserProfile {
  return {
    ...baseUser,
    profile: {
      ...baseUser.profile!,
      jobTitle: "Psychologue",
      skills: ["Médiation artistique"],
      city: "Marseille",
      availableDays: ["Ven"],
      ...profileOverrides,
    },
  };
}

function createNeutralMission(overrides: Partial<SerializedMission> = {}): SerializedMission {
  return {
    ...baseMission,
    id: "neutral-mission",
    title: "Mission cuisine",
    metier: null,
    city: "Paris",
    requiredSkills: [],
    diplomaRequired: false,
    requiredDiploma: [],
    isUrgent: false,
    dateStart: "2026-04-29T10:00:00.000Z",
    dateEnd: "2026-04-29T18:00:00.000Z",
    ...overrides,
  };
}

describe("scoreMissionForFreelance", () => {
  it("score une mission avec métier, compétence, ville, disponibilité et urgence", () => {
    const result = scoreMissionForFreelance(baseMission, baseUser);

    expect(result.score).toBe(85);
    expect(result.reasons).toEqual([
      "Métier proche",
      "Compétence proche",
      "Même ville",
      "Disponible ce jour",
      "Mission urgente",
    ]);
  });

  it("ajoute le score métier quand le titre de mission correspond au métier freelance", () => {
    const result = scoreMissionForFreelance(
      createNeutralMission({ title: "Psychologue en foyer" }),
      createNeutralUser({ jobTitle: "Psychologue", skills: [] }),
    );

    expect(result.score).toBe(30);
    expect(result.reasons).toEqual(["Métier proche"]);
  });

  it("ajoute le score compétences quand une compétence requise correspond", () => {
    const result = scoreMissionForFreelance(
      createNeutralMission({ requiredSkills: ["Gestion de crise"] }),
      createNeutralUser({ jobTitle: "Psychologue", skills: ["Gestion crise"] }),
    );

    expect(result.score).toBe(25);
    expect(result.reasons).toEqual(["Compétence proche"]);
  });

  it("ajoute le score ville quand la mission est dans la même ville", () => {
    const result = scoreMissionForFreelance(
      createNeutralMission({ city: "Lyon" }),
      createNeutralUser({ skills: [], city: "Lyon" }),
    );

    expect(result.score).toBe(15);
    expect(result.reasons).toEqual(["Même ville"]);
  });

  it("ajoute le score disponibilité quand le freelance est disponible le jour de mission", () => {
    const result = scoreMissionForFreelance(
      createNeutralMission({
        dateStart: "2026-04-27T10:00:00.000Z",
        dateEnd: "2026-04-27T18:00:00.000Z",
      }),
      createNeutralUser({ skills: [], availableDays: ["Lundi"] }),
    );

    expect(result.score).toBe(10);
    expect(result.reasons).toEqual(["Disponible ce jour"]);
  });

  it("ajoute le score urgence quand la mission est urgente", () => {
    const result = scoreMissionForFreelance(
      createNeutralMission({ isUrgent: true }),
      createNeutralUser({ skills: [] }),
    );

    expect(result.score).toBe(5);
    expect(result.reasons).toEqual(["Mission urgente"]);
  });

  it("applique une pénalité quand un diplôme est requis sans donnée diplôme connue", () => {
    const result = scoreMissionForFreelance(
      {
        ...baseMission,
        diplomaRequired: true,
      },
      baseUser,
    );

    expect(result.score).toBe(65);
    expect(result.reasons).toContain("Diplôme à vérifier");
  });

  it("ne donne pas de score profil quand le freelance n'a pas de données compatibles", () => {
    const result = scoreMissionForFreelance(
      {
        ...baseMission,
        title: "Mission cuisine",
        metier: null,
        city: "Paris",
        requiredSkills: ["Cuisine collective"],
        isUrgent: false,
      },
      {
        ...baseUser,
        profile: {
          ...baseUser.profile!,
          jobTitle: "Psychologue",
          skills: ["Médiation artistique"],
          city: "Marseille",
          availableDays: ["Ven"],
        },
      },
    );

    expect(result.score).toBe(0);
    expect(result.reasons).toEqual([]);
  });
});

describe("getTopMatchingMissions", () => {
  it("trie par score décroissant puis par date proche", () => {
    const results = getTopMatchingMissions(
      [
        {
          ...baseMission,
          id: "low-score-early",
          title: "Mission cuisine",
          metier: null,
          requiredSkills: [],
          city: "Paris",
          isUrgent: false,
          dateStart: "2026-04-26T10:00:00.000Z",
          dateEnd: "2026-04-26T18:00:00.000Z",
        },
        {
          ...baseMission,
          id: "high-score-late",
          dateStart: "2026-04-29T10:00:00.000Z",
          dateEnd: "2026-04-29T18:00:00.000Z",
        },
        {
          ...baseMission,
          id: "high-score-early",
          dateStart: "2026-04-28T10:00:00.000Z",
          dateEnd: "2026-04-28T18:00:00.000Z",
        },
      ],
      baseUser,
      2,
    );

    expect(results.map((result) => result.mission.id)).toEqual([
      "high-score-early",
      "high-score-late",
    ]);
  });
});
