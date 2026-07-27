import {
  PrismaClient,
  BookingStatus,
  PaymentStatus,
  QuoteStatus,
  ReliefMissionStatus,
  ReviewType,
  ServiceStatus,
  ServiceType,
  UserRole,
  UserStatus,
} from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { addDays, subDays } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

const prisma = new PrismaClient();

const PARIS_TIMEZONE = "Europe/Paris";
const DEFAULT_DEMO_PASSWORD = "password123";
const DEMO_PASSWORD =
  process.env.SEED_DEMO_PASSWORD ??
  process.env.DEMO_USER_PASSWORD ??
  DEFAULT_DEMO_PASSWORD;
const DEMO_PASSWORD_SOURCE = process.env.SEED_DEMO_PASSWORD
  ? "SEED_DEMO_PASSWORD"
  : process.env.DEMO_USER_PASSWORD
    ? "DEMO_USER_PASSWORD"
    : "default(password123)";
const SALT_ROUNDS = 10;

// ─────────────────────────────────────────────
// Images Unsplash pour les services
// ─────────────────────────────────────────────
const SERVICE_IMAGES = {
  violence:
    "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=400&fit=crop&q=80",
  cuisine:
    "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&h=400&fit=crop&q=80",
  visio:
    "https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=600&h=400&fit=crop&q=80",
  art:
    "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=400&fit=crop&q=80",
  sport:
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=400&fit=crop&q=80",
  musique:
    "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&h=400&fit=crop&q=80",
  meditation:
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=400&fit=crop&q=80",
  parentalite:
    "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=600&h=400&fit=crop&q=80",
  ecriture:
    "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&h=400&fit=crop&q=80",
  jardinage:
    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=400&fit=crop&q=80",
};

// ─────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────

type SeedUser = {
  id: string;
  profileId: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  firstName: string;
  lastName: string;
  jobTitle: string;
  bio: string;
  isAvailable?: boolean;
  onboardingStep?: number;
  phone?: string;
  city?: string;
  zipCode?: string;
  skills?: string[];
  availableDays?: string[];
  companyName?: string;
  siret?: string;
};

const seedUsers: SeedUser[] = [
  // ── ADMIN ──
  {
    id: "seed-user-admin-demo",
    profileId: "seed-profile-admin-demo",
    email: "admin@lesextras.local",
    role: UserRole.ADMIN,
    status: UserStatus.VERIFIED,
    firstName: "Camille",
    lastName: "Renaud",
    jobTitle: "Super Admin",
    bio: "Pilotage du back-office LesExtras.",
    onboardingStep: 4,
  },

  // ── ESTABLISHMENTS ──
  {
    id: "seed-user-client-demo",
    profileId: "seed-profile-client-demo",
    email: "directeur@mecs-avenir.fr",
    role: UserRole.ESTABLISHMENT,
    status: UserStatus.VERIFIED,
    firstName: "Laurence",
    lastName: "Ménard",
    jobTitle: "Directrice",
    bio: "Direction de la MECS L'Avenir, coordination des remplacements urgents. 35 places, équipe de 22 éducateurs.",
    onboardingStep: 4,
    phone: "04 72 33 45 67",
    city: "Lyon",
    zipCode: "69003",
    companyName: "MECS L'Avenir",
    siret: "82345678901234",
  },
  {
    id: "seed-user-client-chrs",
    profileId: "seed-profile-client-chrs",
    email: "cadre-nuit@chrs-horizon.fr",
    role: UserRole.ESTABLISHMENT,
    status: UserStatus.VERIFIED,
    firstName: "Sophie",
    lastName: "Bournet",
    jobTitle: "Cadre de nuit",
    bio: "Gestion des équipes de nuit au CHRS Horizon. 60 places d'hébergement d'urgence.",
    onboardingStep: 4,
    phone: "04 78 22 11 33",
    city: "Lyon",
    zipCode: "69007",
    companyName: "CHRS Horizon",
    siret: "91234567890123",
  },
  {
    id: "seed-user-client-ehpad",
    profileId: "seed-profile-client-ehpad",
    email: "coordination@ehpad-rosiers.fr",
    role: UserRole.ESTABLISHMENT,
    status: UserStatus.VERIFIED,
    firstName: "Marc",
    lastName: "Rochat",
    jobTitle: "Coordinateur soins",
    bio: "Pilotage de la continuité des soins en EHPAD. 80 résidents, équipe pluridisciplinaire.",
    onboardingStep: 4,
    phone: "03 20 44 55 66",
    city: "Villeneuve-d'Ascq",
    zipCode: "59491",
    companyName: "EHPAD Les Rosiers",
    siret: "72345678901234",
  },
  {
    id: "seed-user-client-itep",
    profileId: "seed-profile-client-itep",
    email: "direction@itep-monts.fr",
    role: UserRole.ESTABLISHMENT,
    status: UserStatus.VERIFIED,
    firstName: "Claire",
    lastName: "Dubois",
    jobTitle: "Directrice ITEP",
    bio: "Organisation des renforts éducatifs de l'ITEP des Monts. 24 jeunes présentant des troubles du comportement.",
    onboardingStep: 4,
    phone: "05 61 22 33 44",
    city: "Toulouse",
    zipCode: "31100",
    companyName: "ITEP des Monts",
    siret: "62345678901234",
  },

  // ── FREELANCES ──
  {
    id: "seed-user-talent-demo",
    profileId: "seed-profile-talent-demo",
    email: "karim.educ@gmail.com",
    role: UserRole.FREELANCE,
    status: UserStatus.VERIFIED,
    firstName: "Karim",
    lastName: "Bensalem",
    jobTitle: "Éducateur spécialisé",
    bio: "12 ans d'expérience en protection de l'enfance. Spécialisé dans l'accompagnement de jeunes en situation de crise et de rupture.",
    isAvailable: true,
    onboardingStep: 4,
    phone: "06 12 34 56 78",
    city: "Lyon",
    zipCode: "69003",
    skills: ["Protection de l'enfance", "Gestion de crise", "Accompagnement éducatif", "Travail de nuit"],
    availableDays: ["Lun", "Mar", "Mer", "Jeu", "Ven"],
    siret: "52345678901234",
  },
  {
    id: "seed-user-talent-training",
    profileId: "seed-profile-talent-training",
    email: "amelie.formation@prointervenants.fr",
    role: UserRole.FREELANCE,
    status: UserStatus.VERIFIED,
    firstName: "Amélie",
    lastName: "Rodriguez",
    jobTitle: "Formatrice prévention des violences",
    bio: "Formatrice certifiée NCI. 8 ans d'expérience en formation d'équipes sociales et médico-sociales.",
    isAvailable: true,
    onboardingStep: 4,
    phone: "06 23 45 67 89",
    city: "Paris",
    zipCode: "75011",
    skills: ["Gestion de crise", "Désescalade", "Formation", "Prévention violence"],
    availableDays: ["Lun", "Mar", "Jeu", "Ven"],
    siret: "42345678901234",
  },
  {
    id: "seed-user-talent-cooking",
    profileId: "seed-profile-talent-cooking",
    email: "nina.cuisine@prointervenants.fr",
    role: UserRole.FREELANCE,
    status: UserStatus.VERIFIED,
    firstName: "Nina",
    lastName: "Collet",
    jobTitle: "Animatrice cuisine thérapeutique",
    bio: "Éducatrice de formation, spécialisée en médiation cuisine. Ateliers favorisant l'autonomie et la régulation émotionnelle.",
    isAvailable: true,
    onboardingStep: 4,
    phone: "06 34 56 78 90",
    city: "Marseille",
    zipCode: "13001",
    skills: ["Cuisine thérapeutique", "Animation", "Médiation", "Autonomie"],
    availableDays: ["Mar", "Mer", "Jeu", "Sam"],
    siret: "32345678901234",
  },
  {
    id: "seed-user-talent-visio",
    profileId: "seed-profile-talent-visio",
    email: "samir.visio@prointervenants.fr",
    role: UserRole.FREELANCE,
    status: UserStatus.VERIFIED,
    firstName: "Samir",
    lastName: "Haddad",
    jobTitle: "Psychologue clinicien",
    bio: "15 ans de pratique institutionnelle. Supervisions d'équipe et analyse de pratique. Approche systémique et psychodynamique.",
    isAvailable: true,
    onboardingStep: 4,
    phone: "06 45 67 89 01",
    city: "Bordeaux",
    zipCode: "33000",
    skills: ["Analyse de pratique", "Supervision", "Psychologie clinique", "Visioconférence"],
    availableDays: ["Lun", "Mer", "Ven"],
    siret: "22345678901234",
  },
  {
    id: "seed-user-talent-art",
    profileId: "seed-profile-talent-art",
    email: "lucie.art@prointervenants.fr",
    role: UserRole.FREELANCE,
    status: UserStatus.VERIFIED,
    firstName: "Lucie",
    lastName: "Moreau",
    jobTitle: "Art-thérapeute",
    bio: "Diplômée AFRATAPEM. Ateliers d'expression artistique auprès de publics fragilisés : enfants placés, personnes âgées, adultes en réinsertion.",
    isAvailable: true,
    onboardingStep: 4,
    phone: "06 56 78 90 12",
    city: "Nantes",
    zipCode: "44000",
    skills: ["Art-thérapie", "Expression artistique", "Médiation créative", "Peinture"],
    availableDays: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
    siret: "12345678901234",
  },
  {
    id: "seed-user-talent-sport",
    profileId: "seed-profile-talent-sport",
    email: "yannick.sport@prointervenants.fr",
    role: UserRole.FREELANCE,
    status: UserStatus.VERIFIED,
    firstName: "Yannick",
    lastName: "Lefèvre",
    jobTitle: "Éducateur sportif adapté",
    bio: "BPJEPS APT + sport adapté. Boxe éducative, parcours motricité, sports collectifs pour publics en situation de handicap et jeunes en difficulté.",
    isAvailable: true,
    onboardingStep: 4,
    phone: "06 67 89 01 23",
    city: "Lille",
    zipCode: "59000",
    skills: ["Sport adapté", "Boxe éducative", "Motricité", "Cohésion de groupe"],
    availableDays: ["Mer", "Sam", "Dim"],
    siret: "11234567890123",
  },
];

// ─────────────────────────────────────────────
// TIME HELPERS
// ─────────────────────────────────────────────

function parisMidnight(referenceUtc = new Date()): Date {
  const parisNow = toZonedTime(referenceUtc, PARIS_TIMEZONE);
  return new Date(parisNow.getFullYear(), parisNow.getMonth(), parisNow.getDate());
}

function parisDateAt(baseParisDay: Date, hour: number, minute: number): Date {
  const localParisDateTime = new Date(
    baseParisDay.getFullYear(),
    baseParisDay.getMonth(),
    baseParisDay.getDate(),
    hour,
    minute,
    0,
    0,
  );
  return fromZonedTime(localParisDateTime, PARIS_TIMEZONE);
}

function formatDate(baseParisDay: Date): string {
  const year = baseParisDay.getFullYear();
  const month = String(baseParisDay.getMonth() + 1).padStart(2, "0");
  const day = String(baseParisDay.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTonightShift(nowUtc = new Date()): { dateStart: Date; dateEnd: Date } {
  let day = parisMidnight(nowUtc);
  let dateStart = parisDateAt(day, 21, 0);

  if (dateStart <= nowUtc) {
    day = addDays(day, 1);
    dateStart = parisDateAt(day, 21, 0);
  }

  const dateEnd = parisDateAt(addDays(day, 1), 7, 0);
  return { dateStart, dateEnd };
}

function getNextWeekendSlot(nowUtc = new Date()): { dateStart: Date; dateEnd: Date } {
  const baseDay = parisMidnight(nowUtc);
  const dayOfWeek = baseDay.getDay();
  let daysUntilSaturday = (6 - dayOfWeek + 7) % 7;

  if (dayOfWeek === 6 || dayOfWeek === 0) {
    daysUntilSaturday = dayOfWeek === 6 ? 7 : 6;
  }

  const saturday = addDays(baseDay, daysUntilSaturday);
  return {
    dateStart: parisDateAt(saturday, 8, 0),
    dateEnd: parisDateAt(saturday, 20, 0),
  };
}

function getNextWeekSlot(nowUtc = new Date()): { dateStart: Date; dateEnd: Date } {
  const baseDay = parisMidnight(nowUtc);
  const mondayBasedDayIndex = (baseDay.getDay() + 6) % 7;
  const daysUntilNextMonday = 7 - mondayBasedDayIndex;
  const nextMonday = addDays(baseDay, daysUntilNextMonday === 0 ? 7 : daysUntilNextMonday);
  const nextWeekTuesday = addDays(nextMonday, 1);

  return {
    dateStart: parisDateAt(nextWeekTuesday, 9, 0),
    dateEnd: parisDateAt(nextWeekTuesday, 18, 0),
  };
}

// ─────────────────────────────────────────────
// UPSERT: Users & Profiles
// ─────────────────────────────────────────────

async function upsertUsersAndProfiles(): Promise<Map<string, string>> {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);
  const userIdByEmail = new Map<string, string>();

  for (const seedUser of seedUsers) {
    const user = await prisma.user.upsert({
      where: { email: seedUser.email },
      update: {
        password: passwordHash,
        role: seedUser.role,
        status: seedUser.status,
        isAvailable: seedUser.isAvailable ?? false,
        onboardingStep: seedUser.onboardingStep ?? 0,
      },
      create: {
        id: seedUser.id,
        email: seedUser.email,
        password: passwordHash,
        role: seedUser.role,
        status: seedUser.status,
        isAvailable: seedUser.isAvailable ?? false,
        onboardingStep: seedUser.onboardingStep ?? 0,
      },
      select: { id: true, email: true },
    });

    await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        firstName: seedUser.firstName,
        lastName: seedUser.lastName,
        jobTitle: seedUser.jobTitle,
        bio: seedUser.bio,
        phone: seedUser.phone,
        city: seedUser.city,
        zipCode: seedUser.zipCode,
        skills: seedUser.skills ?? [],
        availableDays: seedUser.availableDays ?? [],
        companyName: seedUser.companyName,
        siret: seedUser.siret,
      },
      create: {
        id: seedUser.profileId,
        userId: user.id,
        firstName: seedUser.firstName,
        lastName: seedUser.lastName,
        jobTitle: seedUser.jobTitle,
        bio: seedUser.bio,
        phone: seedUser.phone,
        city: seedUser.city,
        zipCode: seedUser.zipCode,
        skills: seedUser.skills ?? [],
        availableDays: seedUser.availableDays ?? [],
        companyName: seedUser.companyName,
        siret: seedUser.siret,
      },
    });

    userIdByEmail.set(user.email, user.id);
  }

  return userIdByEmail;
}

// ─────────────────────────────────────────────
// UPSERT: Relief Missions (5 missions)
// ─────────────────────────────────────────────

async function upsertReliefMissions(userIdByEmail: Map<string, string>): Promise<void> {
  const tonight = getTonightShift();
  const nextWeekend = getNextWeekendSlot();
  const nextWeek = getNextWeekSlot();
  const today = parisMidnight();

  const missions = [
    {
      id: "seed-mission-veilleur-nuit-urgence",
      title: "Veilleur de nuit - Urgence",
      description: "Remplacement urgent suite à un arrêt maladie. Veille active auprès de 12 jeunes (13-18 ans). Transmissions à 7h. Repas fourni.",
      dateStart: tonight.dateStart,
      dateEnd: tonight.dateEnd,
      hourlyRate: 26,
      address: "MECS Horizon Jeunes, 24 rue des Acacias, 69003 Lyon",
      city: "Lyon",
      zipCode: "69003",
      shift: "NUIT",
      metier: "Veilleur de nuit",
      requiredSkills: ["Veille active", "Protection de l'enfance"],
      establishmentType: "MECS",
      establishmentEmail: "cadre-nuit@chrs-horizon.fr",
      status: ReliefMissionStatus.OPEN,
    },
    {
      id: "seed-mission-aide-soignant-ehpad",
      title: "Aide-Soignant(e) EHPAD - Week-end",
      description: "Renfort week-end pour le service Alzheimer. 20 résidents. Travail en binôme avec l'AS titulaire. Tenue fournie.",
      dateStart: nextWeekend.dateStart,
      dateEnd: nextWeekend.dateEnd,
      hourlyRate: 24,
      address: "EHPAD Les Rosiers, 8 avenue Paul-Bert, 59491 Villeneuve-d'Ascq",
      city: "Villeneuve-d'Ascq",
      zipCode: "59491",
      shift: "JOUR",
      metier: "Aide-soignant",
      requiredSkills: ["Soins", "Alzheimer", "Bientraitance"],
      establishmentType: "EHPAD",
      establishmentEmail: "coordination@ehpad-rosiers.fr",
      status: ReliefMissionStatus.OPEN,
    },
    {
      id: "seed-mission-educateur-renfort-itep",
      title: "Éducateur Spécialisé - Renfort ITEP",
      description: "Renfort éducatif sur le groupe des 10-14 ans. Accompagnement sur les temps de classe et activités. Expérience troubles du comportement souhaitée.",
      dateStart: nextWeek.dateStart,
      dateEnd: nextWeek.dateEnd,
      hourlyRate: 30,
      address: "ITEP des Monts, 12 chemin de la Source, 31100 Toulouse",
      city: "Toulouse",
      zipCode: "31100",
      shift: "JOUR",
      metier: "Éducateur spécialisé",
      requiredSkills: ["Troubles du comportement", "ITEP", "Accompagnement scolaire"],
      establishmentType: "ITEP",
      establishmentEmail: "direction@itep-monts.fr",
      status: ReliefMissionStatus.OPEN,
    },
    {
      id: "seed-mission-veilleur-nuit-longue",
      title: "Veilleur de nuit - Mission longue",
      description: "Mission longue de veille de nuit sur deux nuits non consécutives. Un seul remplaçant couvre l'ensemble du planning.",
      dateStart: parisDateAt(addDays(today, 4), 21, 0),
      dateEnd: parisDateAt(addDays(today, 7), 7, 0),
      hourlyRate: 27,
      address: "CHRS Horizon, 5 place des Récollets, 69007 Lyon",
      city: "Lyon",
      zipCode: "69007",
      shift: "NUIT",
      metier: "Veilleur de nuit",
      requiredSkills: ["Veille active", "Transmissions", "Gestion de crise"],
      establishmentType: "CHRS",
      slots: [
        {
          dateStart: formatDate(addDays(today, 4)),
          heureDebut: "21:00",
          dateEnd: formatDate(addDays(today, 5)),
          heureFin: "07:00",
        },
        {
          dateStart: formatDate(addDays(today, 6)),
          heureDebut: "21:00",
          dateEnd: formatDate(addDays(today, 7)),
          heureFin: "07:00",
        },
      ],
      establishmentEmail: "cadre-nuit@chrs-horizon.fr",
      status: ReliefMissionStatus.OPEN,
    },
    {
      id: "seed-mission-moniteur-educ-mecs",
      title: "Moniteur éducateur - Internat MECS",
      description: "Remplacement sur 3 jours au sein du groupe des adolescentes (14-17 ans). Horaires d'internat : 7h-14h ou 14h-22h selon planning.",
      dateStart: parisDateAt(addDays(today, 3), 7, 0),
      dateEnd: parisDateAt(addDays(today, 6), 22, 0),
      hourlyRate: 22,
      address: "MECS L'Avenir, 15 rue Jean Jaurès, 69003 Lyon",
      city: "Lyon",
      zipCode: "69003",
      shift: "JOUR",
      metier: "Moniteur éducateur",
      requiredSkills: ["Internat", "Adolescentes", "Protection de l'enfance"],
      establishmentType: "MECS",
      slots: [
        {
          dateStart: formatDate(addDays(today, 3)),
          heureDebut: "07:00",
          dateEnd: formatDate(addDays(today, 3)),
          heureFin: "14:00",
        },
        {
          dateStart: formatDate(addDays(today, 5)),
          heureDebut: "14:00",
          dateEnd: formatDate(addDays(today, 5)),
          heureFin: "22:00",
        },
        {
          dateStart: formatDate(addDays(today, 6)),
          heureDebut: "07:00",
          dateEnd: formatDate(addDays(today, 6)),
          heureFin: "14:00",
        },
      ],
      establishmentEmail: "directeur@mecs-avenir.fr",
      status: ReliefMissionStatus.OPEN,
    },
    {
      id: "seed-mission-batch-mecs-1",
      title: "Accompagnant éducatif - Renfort ponctuel 1/2",
      description: "Mission issue d'une publication multi-missions. Renfort sur le temps du lever et des accompagnements extérieurs.",
      dateStart: parisDateAt(addDays(today, 8), 6, 30),
      dateEnd: parisDateAt(addDays(today, 8), 13, 30),
      hourlyRate: 23,
      address: "MECS L'Avenir, 15 rue Jean Jaurès, 69003 Lyon",
      city: "Lyon",
      zipCode: "69003",
      shift: "JOUR",
      metier: "Accompagnant éducatif et social",
      requiredSkills: ["Lever", "Accompagnement quotidien"],
      establishmentType: "MECS",
      slots: [
        {
          dateStart: formatDate(addDays(today, 8)),
          heureDebut: "06:30",
          dateEnd: formatDate(addDays(today, 8)),
          heureFin: "13:30",
        },
      ],
      establishmentEmail: "directeur@mecs-avenir.fr",
      status: ReliefMissionStatus.OPEN,
    },
    {
      id: "seed-mission-batch-mecs-2",
      title: "Accompagnant éducatif - Renfort ponctuel 2/2",
      description: "Seconde mission du lot batch, non contiguë, pour sécuriser le retour d'activité et les transmissions du soir.",
      dateStart: parisDateAt(addDays(today, 10), 15, 0),
      dateEnd: parisDateAt(addDays(today, 10), 22, 0),
      hourlyRate: 23,
      address: "MECS L'Avenir, 15 rue Jean Jaurès, 69003 Lyon",
      city: "Lyon",
      zipCode: "69003",
      shift: "JOUR",
      metier: "Accompagnant éducatif et social",
      requiredSkills: ["Transmissions", "Accompagnement quotidien"],
      establishmentType: "MECS",
      slots: [
        {
          dateStart: formatDate(addDays(today, 10)),
          heureDebut: "15:00",
          dateEnd: formatDate(addDays(today, 10)),
          heureFin: "22:00",
        },
      ],
      establishmentEmail: "directeur@mecs-avenir.fr",
      status: ReliefMissionStatus.OPEN,
    },
    {
      id: "seed-mission-completed-educ",
      title: "Éducateur spécialisé - Renfort week-end (terminée)",
      description: "Mission de renfort terminée avec succès. Accompagnement de 8 jeunes sur un week-end prolongé.",
      dateStart: parisDateAt(subDays(today, 10), 8, 0),
      dateEnd: parisDateAt(subDays(today, 8), 20, 0),
      hourlyRate: 28,
      address: "MECS L'Avenir, 15 rue Jean Jaurès, 69003 Lyon",
      city: "Lyon",
      zipCode: "69003",
      shift: "JOUR",
      metier: "Éducateur spécialisé",
      requiredSkills: ["Protection de l'enfance", "Week-end"],
      establishmentType: "MECS",
      establishmentEmail: "directeur@mecs-avenir.fr",
      status: ReliefMissionStatus.COMPLETED,
    },
  ];

  for (const mission of missions) {
    const establishmentId = userIdByEmail.get(mission.establishmentEmail);
    if (!establishmentId) throw new Error(`Établissement introuvable : ${mission.establishmentEmail}`);

    await prisma.reliefMission.upsert({
      where: { id: mission.id },
      update: {
        title: mission.title,
        description: mission.description,
        dateStart: mission.dateStart,
        dateEnd: mission.dateEnd,
        hourlyRate: mission.hourlyRate,
        address: mission.address,
        city: mission.city,
        zipCode: mission.zipCode,
        shift: mission.shift,
        metier: mission.metier,
        requiredSkills: mission.requiredSkills,
        establishmentType: mission.establishmentType,
        slots: mission.slots ?? null,
        establishmentId,
        status: mission.status,
      },
      create: {
        id: mission.id,
        title: mission.title,
        description: mission.description,
        dateStart: mission.dateStart,
        dateEnd: mission.dateEnd,
        hourlyRate: mission.hourlyRate,
        address: mission.address,
        city: mission.city,
        zipCode: mission.zipCode,
        shift: mission.shift,
        metier: mission.metier,
        requiredSkills: mission.requiredSkills,
        establishmentType: mission.establishmentType,
        slots: mission.slots ?? null,
        establishmentId,
        status: mission.status,
      },
    });
  }
}

// ─────────────────────────────────────────────
// UPSERT: Services (10 ateliers & formations avec images)
// ─────────────────────────────────────────────

async function upsertServices(userIdByEmail: Map<string, string>): Promise<void> {
  const services = [
    {
      id: "seed-service-gestion-violence",
      title: "Formation Gestion de la Violence (Non-Violent Crisis Intervention)",
      description:
        "Formation intensive de 2 jours sur la prévention de l'escalade, la désescalade verbale et la sécurisation physique d'équipe. Certification NCI incluse.",
      price: 490,
      type: ServiceType.TRAINING,
      capacity: 12,
      durationMinutes: 840,
      category: "prevention",
      ownerEmail: "amelie.formation@prointervenants.fr",
      imageUrl: SERVICE_IMAGES.violence,
      objectives: "Identifier les phases d'escalade de la violence.\nMaîtriser les techniques de désescalade verbale.\nConnaître le cadre légal de la contention.\nSavoir sécuriser une situation de crise en équipe.",
      methodology: "Alternance théorie/pratique (60% mises en situation). Travail sur cas réels. Jeux de rôle filmés et débriefés.",
      publicCible: ["educateurs", "moniteurs", "aides-soignants"],
    },
    {
      id: "seed-service-cuisine-therapeutique",
      title: "Atelier Cuisine Thérapeutique",
      description:
        "Atelier pratique favorisant autonomie, régulation émotionnelle et cohésion de groupe via la cuisine. Recettes adaptées. Matériel fourni.",
      price: 280,
      type: ServiceType.WORKSHOP,
      capacity: 8,
      durationMinutes: 180,
      category: "bien-etre",
      ownerEmail: "nina.cuisine@prointervenants.fr",
      imageUrl: SERVICE_IMAGES.cuisine,
      objectives: "Favoriser l'autonomie dans les gestes du quotidien.\nTravailler la motricité fine et la concentration.\nCréer un moment de plaisir partagé.\nAborder l'alimentation équilibrée de manière ludique.",
      methodology: "Recettes simples choisies avec le groupe. Chaque participant réalise sa portion. Dégustation collective.",
      publicCible: ["enfants", "adolescents", "adultes-handicap"],
    },
    {
      id: "seed-service-analyse-pratique-visio",
      title: "Analyse de Pratique Professionnelle (Visio)",
      description:
        "Supervision collective en visioconférence pour analyser les situations complexes et ajuster les postures professionnelles. 1h30 / session.",
      price: 220,
      type: ServiceType.TRAINING,
      capacity: 10,
      durationMinutes: 90,
      category: "supervision",
      ownerEmail: "samir.visio@prointervenants.fr",
      imageUrl: SERVICE_IMAGES.visio,
      objectives: "Prendre du recul sur les situations difficiles.\nRenforcer la cohésion d'équipe.\nDévelopper une pratique réflexive.\nPrévenir l'usure professionnelle.",
      methodology: "Présentation d'une situation par un participant. Questionnement collectif méthode Balint. Synthèse et pistes d'action.",
      publicCible: ["educateurs", "moniteurs", "psychologues"],
    },
    {
      id: "seed-service-art-therapie",
      title: "Atelier Art-Thérapie : Expression & Émotions",
      description:
        "Séance d'art-thérapie centrée sur l'expression des émotions par la peinture, le collage et le modelage. Aucune compétence artistique requise.",
      price: 320,
      type: ServiceType.WORKSHOP,
      capacity: 8,
      durationMinutes: 150,
      category: "bien-etre",
      ownerEmail: "lucie.art@prointervenants.fr",
      imageUrl: SERVICE_IMAGES.art,
      objectives: "Permettre l'expression des émotions sans passer par le verbal.\nDévelopper la créativité et l'estime de soi.\nFavoriser la détente et le lâcher-prise.",
      methodology: "Proposition d'un thème ouvert. Création libre avec différents médiums. Temps de parole facultatif en fin de séance.",
      publicCible: ["enfants", "adolescents", "personnes-agees"],
    },
    {
      id: "seed-service-sport-adapte",
      title: "Boxe Éducative & Sport Adapté",
      description:
        "Atelier de boxe éducative et sport adapté. Respect des règles, canalisation de l'énergie, confiance en soi. Matériel (gants, pattes d'ours) fourni.",
      price: 350,
      type: ServiceType.WORKSHOP,
      capacity: 12,
      durationMinutes: 120,
      category: "sport",
      ownerEmail: "yannick.sport@prointervenants.fr",
      imageUrl: SERVICE_IMAGES.sport,
      objectives: "Canaliser l'énergie et les tensions.\nApprendre le respect des règles et de l'adversaire.\nDévelopper la confiance en soi.",
      methodology: "Échauffement ludique. Techniques de base (jab, esquive). Exercices binôme. Retour au calme et étirements.",
      publicCible: ["adolescents", "jeunes-adultes"],
    },
    {
      id: "seed-service-meditation-pleine-conscience",
      title: "Initiation à la Méditation de Pleine Conscience",
      description:
        "Programme inspiré du MBSR adapté aux professionnels du médico-social pour prévenir le burnout et améliorer la qualité de présence.",
      price: 180,
      type: ServiceType.TRAINING,
      capacity: 15,
      durationMinutes: 60,
      category: "bien-etre",
      ownerEmail: "samir.visio@prointervenants.fr",
      imageUrl: SERVICE_IMAGES.meditation,
      objectives: "Découvrir les bases de la pleine conscience.\nApprendre des exercices de respiration et de body scan.\nRéduire le stress et l'anxiété.",
      methodology: "Pratique guidée en groupe. Exercices de respiration. Méditation assise et marchée. Échanges sur les ressentis.",
      publicCible: ["educateurs", "aides-soignants", "moniteurs"],
    },
    {
      id: "seed-service-soutien-parentalite",
      title: "Groupe de Parole — Soutien à la Parentalité",
      description:
        "Animation de groupes de parole pour parents en difficulté. Approche bienveillante. Thèmes : autorité, communication, gestion des écrans, séparation.",
      price: 250,
      type: ServiceType.WORKSHOP,
      capacity: 12,
      durationMinutes: 120,
      category: "parentalite",
      ownerEmail: "amelie.formation@prointervenants.fr",
      imageUrl: SERVICE_IMAGES.parentalite,
      objectives: "Créer un espace d'écoute entre pairs.\nPartager des stratégies éducatives.\nRenforcer le lien parent-enfant.",
      methodology: "Tour de table thématique. Échanges libres facilités. Apports psycho-éducatifs courts. Ressources documentaires distribuées.",
      publicCible: ["parents", "familles"],
    },
    {
      id: "seed-service-atelier-ecriture",
      title: "Atelier d'Écriture Créative",
      description:
        "Exploration de soi par l'écriture. Propositions ludiques et poétiques. Aucun prérequis. Adapté aux personnes en réinsertion, jeunes en foyer, résidents d'EHPAD.",
      price: 200,
      type: ServiceType.WORKSHOP,
      capacity: 10,
      durationMinutes: 120,
      category: "bien-etre",
      ownerEmail: "lucie.art@prointervenants.fr",
      imageUrl: SERVICE_IMAGES.ecriture,
      objectives: "Stimuler l'imagination et le plaisir d'écrire.\nFavoriser l'expression personnelle.\nCréer du lien social par le partage de textes.",
      methodology: "Jeux d'écriture (cadavre exquis, portrait chinois, haïku). Écriture individuelle chronométrée. Lectures volontaires.",
      publicCible: ["adolescents", "adultes-reinsertion", "personnes-agees"],
    },
    {
      id: "seed-service-jardinage-therapeutique",
      title: "Atelier Jardinage Thérapeutique",
      description:
        "Hortithérapie en jardin partagé. Plantation, entretien, récolte. Travail sensoriel et moteur adapté à tous les publics.",
      price: 260,
      type: ServiceType.WORKSHOP,
      capacity: 8,
      durationMinutes: 150,
      category: "bien-etre",
      ownerEmail: "nina.cuisine@prointervenants.fr",
      imageUrl: SERVICE_IMAGES.jardinage,
      objectives: "Reconnecter au vivant et aux saisons.\nTravailler la motricité et la coordination.\nFavoriser la patience et le soin.",
      methodology: "Activités adaptées selon la saison. Travail en petits groupes. Temps calme d'observation. Carnet de bord du jardin.",
      publicCible: ["personnes-agees", "adultes-handicap", "adolescents"],
    },
    {
      id: "seed-service-musique-eveil",
      title: "Éveil Musical & Percussions Corporelles",
      description:
        "Atelier d'éveil musical accessible à tous. Rythme, voix, percussions corporelles et petits instruments. Communication non-verbale et cohésion.",
      price: 300,
      type: ServiceType.WORKSHOP,
      capacity: 12,
      durationMinutes: 90,
      category: "bien-etre",
      ownerEmail: "yannick.sport@prointervenants.fr",
      imageUrl: SERVICE_IMAGES.musique,
      objectives: "Découvrir le rythme de manière corporelle.\nDévelopper l'écoute de soi et des autres.\nVivre un moment de joie collective.",
      methodology: "Échauffement vocal et corporel. Jeux rythmiques progressifs. Création d'une pièce collective. Écoute musicale active.",
      publicCible: ["enfants", "adolescents", "adultes-handicap"],
    },
  ];

  for (const service of services) {
    const ownerId = userIdByEmail.get(service.ownerEmail);
    if (!ownerId) throw new Error(`Freelance introuvable : ${service.ownerEmail}`);

    await prisma.service.upsert({
      where: { id: service.id },
      update: {
        title: service.title,
        description: service.description,
        price: service.price,
        type: service.type,
        capacity: service.capacity,
        durationMinutes: service.durationMinutes,
        category: service.category,
        imageUrl: service.imageUrl,
        objectives: service.objectives,
        methodology: service.methodology,
        publicCible: service.publicCible ?? [],
        status: ServiceStatus.ACTIVE,
        ownerId,
      },
      create: {
        id: service.id,
        title: service.title,
        description: service.description,
        price: service.price,
        type: service.type,
        capacity: service.capacity,
        durationMinutes: service.durationMinutes,
        category: service.category,
        imageUrl: service.imageUrl,
        objectives: service.objectives,
        methodology: service.methodology,
        publicCible: service.publicCible ?? [],
        status: ServiceStatus.ACTIVE,
        ownerId,
      },
    });
  }
}

// ─────────────────────────────────────────────
// UPSERT: Bookings + Reviews + Invoices + Quotes + Conversations
// ─────────────────────────────────────────────

async function upsertBookingsAndRelated(userIdByEmail: Map<string, string>): Promise<void> {
  const now = new Date();
  const today = parisMidnight(now);

  const getId = (email: string) => {
    const id = userIdByEmail.get(email);
    if (!id) throw new Error(`User introuvable : ${email}`);
    return id;
  };

  // ── Booking 1: Mission terminée + PAID + Review + Invoice ──
  const booking1Id = "seed-booking-mission-completed";
  await prisma.booking.upsert({
    where: { id: booking1Id },
    update: { status: BookingStatus.PAID, paymentStatus: PaymentStatus.PAID },
    create: {
      id: booking1Id,
      status: BookingStatus.PAID,
      paymentStatus: PaymentStatus.PAID,
      message: "Merci pour cette mission, je suis disponible ce week-end.",
      proposedRate: 28,
      freelanceAcknowledged: true,
      scheduledAt: subDays(now, 10),
      establishmentId: getId("directeur@mecs-avenir.fr"),
      freelanceId: getId("karim.educ@gmail.com"),
      reliefMissionId: "seed-mission-completed-educ",
    },
  });

  await prisma.invoice.upsert({
    where: { bookingId: booking1Id },
    update: { amount: 896, status: "PAID" },
    create: {
      id: "seed-invoice-1",
      bookingId: booking1Id,
      amount: 896,
      invoiceNumber: "INV-2026-0001",
      status: "PAID",
    },
  });

  await prisma.review.upsert({
    where: { bookingId_authorId: { bookingId: booking1Id, authorId: getId("directeur@mecs-avenir.fr") } },
    update: {},
    create: {
      id: "seed-review-1-estab",
      bookingId: booking1Id,
      authorId: getId("directeur@mecs-avenir.fr"),
      targetId: getId("karim.educ@gmail.com"),
      rating: 5,
      comment: "Karim est intervenu avec un grand professionnalisme. Les jeunes l'ont très bien accueilli. Je recommande vivement.",
      type: ReviewType.ESTABLISHMENT_TO_FREELANCE,
    },
  });

  await prisma.review.upsert({
    where: { bookingId_authorId: { bookingId: booking1Id, authorId: getId("karim.educ@gmail.com") } },
    update: {},
    create: {
      id: "seed-review-1-free",
      bookingId: booking1Id,
      authorId: getId("karim.educ@gmail.com"),
      targetId: getId("directeur@mecs-avenir.fr"),
      rating: 4,
      comment: "Bonne organisation, transmissions claires. L'équipe est accueillante.",
      type: ReviewType.FREELANCE_TO_ESTABLISHMENT,
    },
  });

  // ── Booking 2: Atelier cuisine confirmé (à venir) ──
  const booking2Id = "seed-booking-atelier-cuisine";
  await prisma.booking.upsert({
    where: { id: booking2Id },
    update: { status: BookingStatus.CONFIRMED },
    create: {
      id: booking2Id,
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PENDING,
      message: "Nous aimerions organiser cet atelier pour notre groupe du mercredi (8 jeunes, 12-16 ans).",
      nbParticipants: 8,
      scheduledAt: addDays(now, 7),
      establishmentId: getId("directeur@mecs-avenir.fr"),
      freelanceId: getId("nina.cuisine@prointervenants.fr"),
      serviceId: "seed-service-cuisine-therapeutique",
    },
  });

  // ── Booking 3: Formation violence — devis envoyé ──
  const booking3Id = "seed-booking-formation-violence";
  await prisma.booking.upsert({
    where: { id: booking3Id },
    update: { status: BookingStatus.QUOTE_SENT },
    create: {
      id: booking3Id,
      status: BookingStatus.QUOTE_SENT,
      paymentStatus: PaymentStatus.PENDING,
      message: "Nous souhaitons former nos 12 éducateurs à la gestion de la violence. Disponible en avril ?",
      nbParticipants: 12,
      scheduledAt: addDays(now, 14),
      establishmentId: getId("direction@itep-monts.fr"),
      freelanceId: getId("amelie.formation@prointervenants.fr"),
      serviceId: "seed-service-gestion-violence",
    },
  });

  const subtotalHT = 490 * 2;
  const vatAmount = subtotalHT * 0.2;
  await prisma.quote.upsert({
    where: { id: "seed-quote-1" },
    update: {},
    create: {
      id: "seed-quote-1",
      bookingId: booking3Id,
      issuedBy: getId("amelie.formation@prointervenants.fr"),
      status: QuoteStatus.SENT,
      subtotalHT,
      vatRate: 0.2,
      vatAmount,
      totalTTC: subtotalHT + vatAmount,
      validUntil: addDays(now, 30),
      conditions: "Acompte de 30% à la commande. Solde à réception de la facture. Annulation gratuite jusqu'à 15 jours avant.",
      notes: "Tarif incluant la formation de 2 jours + supports pédagogiques + certification NCI.",
      lines: {
        create: [
          {
            id: "seed-quoteline-1a",
            description: "Formation Gestion de la Violence — Jour 1 (théorie + mises en situation)",
            quantity: 1,
            unitPrice: 490,
            unit: "journée",
            totalHT: 490,
          },
          {
            id: "seed-quoteline-1b",
            description: "Formation Gestion de la Violence — Jour 2 (pratique + certification)",
            quantity: 1,
            unitPrice: 490,
            unit: "journée",
            totalHT: 490,
          },
        ],
      },
    },
  });

  // ── Booking 4: Candidature mission en attente ──
  const booking4Id = "seed-booking-candidature-nuit";
  await prisma.booking.upsert({
    where: { id: booking4Id },
    update: { status: BookingStatus.PENDING },
    create: {
      id: booking4Id,
      status: BookingStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      message: "Bonjour, je suis disponible pour la veille de ce soir. J'ai 5 ans d'expérience en MECS.",
      proposedRate: 26,
      scheduledAt: now,
      establishmentId: getId("cadre-nuit@chrs-horizon.fr"),
      freelanceId: getId("karim.educ@gmail.com"),
      reliefMissionId: "seed-mission-veilleur-nuit-urgence",
    },
  });

  // ── Booking 5: Art-thérapie terminée, en attente de paiement ──
  const booking5Id = "seed-booking-art-therapie-done";
  await prisma.booking.upsert({
    where: { id: booking5Id },
    update: { status: BookingStatus.AWAITING_PAYMENT },
    create: {
      id: booking5Id,
      status: BookingStatus.AWAITING_PAYMENT,
      paymentStatus: PaymentStatus.PENDING,
      message: "Atelier réalisé avec le groupe du jeudi. Très beau moment de partage.",
      nbParticipants: 6,
      scheduledAt: subDays(now, 3),
      establishmentId: getId("coordination@ehpad-rosiers.fr"),
      freelanceId: getId("lucie.art@prointervenants.fr"),
      serviceId: "seed-service-art-therapie",
    },
  });

  await prisma.invoice.upsert({
    where: { bookingId: booking5Id },
    update: { amount: 320, status: "UNPAID" },
    create: {
      id: "seed-invoice-2",
      bookingId: booking5Id,
      amount: 320,
      invoiceNumber: "INV-2026-0002",
      status: "UNPAID",
    },
  });

  await prisma.review.upsert({
    where: { bookingId_authorId: { bookingId: booking5Id, authorId: getId("coordination@ehpad-rosiers.fr") } },
    update: {},
    create: {
      id: "seed-review-2-estab",
      bookingId: booking5Id,
      authorId: getId("coordination@ehpad-rosiers.fr"),
      targetId: getId("lucie.art@prointervenants.fr"),
      rating: 5,
      comment: "Lucie a su créer un espace de douceur et de confiance. Les résidents ont adoré. Merci !",
      type: ReviewType.ESTABLISHMENT_TO_FREELANCE,
    },
  });

  // ── Booking 6: Sport adapté — en cours ──
  const booking6Id = "seed-booking-sport-en-cours";
  await prisma.booking.upsert({
    where: { id: booking6Id },
    update: { status: BookingStatus.IN_PROGRESS },
    create: {
      id: booking6Id,
      status: BookingStatus.IN_PROGRESS,
      paymentStatus: PaymentStatus.PENDING,
      message: "Cycle de 4 séances de boxe éducative pour nos ados, 1 séance par semaine.",
      nbParticipants: 10,
      scheduledAt: subDays(now, 1),
      establishmentId: getId("direction@itep-monts.fr"),
      freelanceId: getId("yannick.sport@prointervenants.fr"),
      serviceId: "seed-service-sport-adapte",
    },
  });

  // ── Booking 7: Analyse de pratique annulée ──
  const booking7Id = "seed-booking-analyse-annulee";
  await prisma.booking.upsert({
    where: { id: booking7Id },
    update: { status: BookingStatus.CANCELLED },
    create: {
      id: booking7Id,
      status: BookingStatus.CANCELLED,
      paymentStatus: PaymentStatus.CANCELLED,
      message: "Annulation suite à un changement de direction. Nous reprendrons contact au T2.",
      nbParticipants: 8,
      scheduledAt: subDays(now, 5),
      establishmentId: getId("cadre-nuit@chrs-horizon.fr"),
      freelanceId: getId("samir.visio@prointervenants.fr"),
      serviceId: "seed-service-analyse-pratique-visio",
    },
  });

  // ── Conversations ──
  const convo1Id = "seed-convo-cuisine";
  await prisma.conversation.upsert({
    where: { id: convo1Id },
    update: {},
    create: {
      id: convo1Id,
      participantAId: getId("directeur@mecs-avenir.fr"),
      participantBId: getId("nina.cuisine@prointervenants.fr"),
      bookingId: booking2Id,
    },
  });

  const messagesConvo1 = [
    {
      id: "seed-msg-1a",
      content: "Bonjour Nina, nous aimerions organiser un atelier cuisine pour 8 jeunes (12-16 ans) le mercredi après-midi. Est-ce possible ?",
      senderId: getId("directeur@mecs-avenir.fr"),
      receiverId: getId("nina.cuisine@prointervenants.fr"),
      createdAt: subDays(now, 5),
    },
    {
      id: "seed-msg-1b",
      content: "Bonjour Laurence ! Oui tout à fait, j'ai un créneau mercredi prochain. Je prévois des recettes sucrées et salées adaptées aux ados. Y a-t-il des allergies ?",
      senderId: getId("nina.cuisine@prointervenants.fr"),
      receiverId: getId("directeur@mecs-avenir.fr"),
      createdAt: subDays(now, 4),
    },
    {
      id: "seed-msg-1c",
      content: "Pas d'allergie connue. Un jeune est végétarien. Vous pouvez prévoir des options ? On a une cuisine équipée.",
      senderId: getId("directeur@mecs-avenir.fr"),
      receiverId: getId("nina.cuisine@prointervenants.fr"),
      createdAt: subDays(now, 4),
    },
    {
      id: "seed-msg-1d",
      content: "Parfait, je m'adapte ! Cookies végé + wraps avec option végé. J'apporte les ingrédients et tabliers. RDV à 14h ?",
      senderId: getId("nina.cuisine@prointervenants.fr"),
      receiverId: getId("directeur@mecs-avenir.fr"),
      createdAt: subDays(now, 3),
    },
    {
      id: "seed-msg-1e",
      content: "14h c'est parfait. Merci beaucoup Nina, les jeunes ont hâte !",
      senderId: getId("directeur@mecs-avenir.fr"),
      receiverId: getId("nina.cuisine@prointervenants.fr"),
      createdAt: subDays(now, 3),
    },
  ];

  for (const msg of messagesConvo1) {
    await prisma.message.upsert({
      where: { id: msg.id },
      update: {},
      create: {
        id: msg.id,
        content: msg.content,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        conversationId: convo1Id,
        createdAt: msg.createdAt,
        isRead: false,
      },
    });
  }

  const convo2Id = "seed-convo-mission-completed";
  await prisma.conversation.upsert({
    where: { id: convo2Id },
    update: {},
    create: {
      id: convo2Id,
      participantAId: getId("directeur@mecs-avenir.fr"),
      participantBId: getId("karim.educ@gmail.com"),
      bookingId: booking1Id,
    },
  });

  const messagesConvo2 = [
    {
      id: "seed-msg-2a",
      content: "Bonjour Karim, nous avons besoin d'un éducateur spécialisé pour le week-end prolongé. Seriez-vous disponible ?",
      senderId: getId("directeur@mecs-avenir.fr"),
      receiverId: getId("karim.educ@gmail.com"),
      createdAt: subDays(now, 14),
    },
    {
      id: "seed-msg-2b",
      content: "Bonjour Laurence, je suis disponible. J'ai 12 ans d'expérience en MECS. Quelles sont les tranches horaires ?",
      senderId: getId("karim.educ@gmail.com"),
      receiverId: getId("directeur@mecs-avenir.fr"),
      createdAt: subDays(now, 14),
    },
    {
      id: "seed-msg-2c",
      content: "Horaires : 8h-20h samedi et dimanche, 8h-14h lundi. Groupe de 8 ados (14-17 ans). Transmissions à 8h.",
      senderId: getId("directeur@mecs-avenir.fr"),
      receiverId: getId("karim.educ@gmail.com"),
      createdAt: subDays(now, 13),
    },
    {
      id: "seed-msg-2d",
      content: "Merci pour la mission Karim. Les retours sont excellents. La facture a été validée, le paiement part cette semaine.",
      senderId: getId("directeur@mecs-avenir.fr"),
      receiverId: getId("karim.educ@gmail.com"),
      createdAt: subDays(now, 7),
    },
    {
      id: "seed-msg-2e",
      content: "Merci Laurence. C'était un plaisir, l'équipe est top. N'hésitez pas si vous avez d'autres besoins !",
      senderId: getId("karim.educ@gmail.com"),
      receiverId: getId("directeur@mecs-avenir.fr"),
      createdAt: subDays(now, 7),
    },
  ];

  for (const msg of messagesConvo2) {
    await prisma.message.upsert({
      where: { id: msg.id },
      update: {},
      create: {
        id: msg.id,
        content: msg.content,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        conversationId: convo2Id,
        createdAt: msg.createdAt,
        isRead: true,
      },
    });
  }

  // ── Notifications ──
  const notifications = [
    {
      id: "seed-notif-1",
      userId: getId("directeur@mecs-avenir.fr"),
      message: "Karim Bensalem a postulé à votre mission « Veilleur de nuit - Urgence ».",
      type: "INFO",
    },
    {
      id: "seed-notif-2",
      userId: getId("karim.educ@gmail.com"),
      message: "Votre paiement de 896 € pour la mission « Éducateur spécialisé - Renfort week-end » a été confirmé.",
      type: "SUCCESS",
    },
    {
      id: "seed-notif-3",
      userId: getId("direction@itep-monts.fr"),
      message: "Amélie Rodriguez vous a envoyé un devis pour la formation « Gestion de la Violence ».",
      type: "INFO",
    },
    {
      id: "seed-notif-4",
      userId: getId("nina.cuisine@prointervenants.fr"),
      message: "Nouvelle réservation ! MECS L'Avenir souhaite un atelier cuisine pour 8 participants.",
      type: "SUCCESS",
    },
    {
      id: "seed-notif-5",
      userId: getId("lucie.art@prointervenants.fr"),
      message: "L'EHPAD Les Rosiers vous a laissé un avis 5 étoiles !",
      type: "SUCCESS",
    },
    {
      id: "seed-notif-6",
      userId: getId("coordination@ehpad-rosiers.fr"),
      message: "Facture INV-2026-0002 (320 €) en attente de règlement pour l'atelier Art-Thérapie.",
      type: "WARNING",
    },
  ];

  for (const notif of notifications) {
    await prisma.notification.upsert({
      where: { id: notif.id },
      update: {},
      create: {
        id: notif.id,
        userId: notif.userId,
        message: notif.message,
        type: notif.type,
      },
    });
  }
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────

export async function main(): Promise<void> {
  console.log("Seeding LesExtras demo data...");
  console.log(`  Timezone: ${PARIS_TIMEZONE}`);
  console.log(`  Password source: ${DEMO_PASSWORD_SOURCE}`);

  const userIdByEmail = await upsertUsersAndProfiles();
  console.log(`  ${userIdByEmail.size} users + profiles`);

  await upsertReliefMissions(userIdByEmail);
  console.log("  5 relief missions");

  await upsertServices(userIdByEmail);
  console.log("  10 services (ateliers & formations) avec images");

  await upsertBookingsAndRelated(userIdByEmail);
  console.log("  7 bookings + 2 invoices + 3 reviews + 1 quote + 2 conversations + 6 notifications");

  console.log("\nDemo accounts (all same password):");
  console.log("  ADMIN         admin@lesextras.local");
  console.log("  ESTABLISHMENT directeur@mecs-avenir.fr");
  console.log("  ESTABLISHMENT cadre-nuit@chrs-horizon.fr");
  console.log("  ESTABLISHMENT coordination@ehpad-rosiers.fr");
  console.log("  ESTABLISHMENT direction@itep-monts.fr");
  console.log("  FREELANCE     karim.educ@gmail.com");
  console.log("  FREELANCE     amelie.formation@prointervenants.fr");
  console.log("  FREELANCE     nina.cuisine@prointervenants.fr");
  console.log("  FREELANCE     samir.visio@prointervenants.fr");
  console.log("  FREELANCE     lucie.art@prointervenants.fr");
  console.log("  FREELANCE     yannick.sport@prointervenants.fr");
  console.log("\nSeed completed!");
}

void main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
