/**
 * ============================================================================
 * LES EXTRAS v3 — Seed Prisma (idempotent, upsert)
 * ----------------------------------------------------------------------------
 * Données réalistes médico-social :
 *   1 admin plateforme
 *   2 comptes ESTABLISHMENT (MECS + IME) avec sous-comptes (rôles variés)
 *     + invitations en attente
 *   3 comptes FREELANCE avec profils/métiers
 *   Missions SOS Renfort (statuts/visibilités variés)
 *   Ateliers / Éducat'heures (services)
 *   Bookings, avis bidirectionnels, notifications, messagerie, 1 facture,
 *   documents (coffre-fort conformité)
 *
 * Exécution : `pnpm --filter @lesextras/api prisma:seed`
 *   (prisma.seed = "ts-node prisma/seed.ts", configuré par Backend-Core)
 * Ré-exécutable sans doublon grâce aux `upsert` sur clés uniques / ids fixes.
 * ============================================================================
 */
import {
  PrismaClient,
  GlobalRole,
  UserStatus,
  AccountType,
  AccountRole,
  MembershipStatus,
  InvitationStatus,
  MissionCategory,
  MissionStatus,
  MissionVisibility,
  ServiceCategory,
  ServiceStatus,
  BookingStatus,
  InvoiceStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Mot de passe commun à tous les comptes de démo (à ne jamais utiliser en prod).
const DEMO_PASSWORD = 'Password123!';

const days = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

async function main() {
  const password = await bcrypt.hash(DEMO_PASSWORD, 10);

  // ---- Fabriques -----------------------------------------------------------
  const upsertUser = (
    id: string,
    email: string,
    firstName: string,
    lastName: string,
    extra: Record<string, unknown> = {},
  ) =>
    prisma.user.upsert({
      where: { email },
      update: { firstName, lastName, ...extra },
      create: {
        id,
        email,
        password,
        firstName,
        lastName,
        role: GlobalRole.USER,
        status: UserStatus.VERIFIED,
        emailVerified: true,
        onboardingStep: 3,
        ...extra,
      },
    });

  const upsertMembership = (
    userId: string,
    accountId: string,
    role: AccountRole,
  ) =>
    prisma.membership.upsert({
      where: { userId_accountId: { userId, accountId } },
      update: { role, status: MembershipStatus.ACTIVE },
      create: { userId, accountId, role, status: MembershipStatus.ACTIVE },
    });

  // ==========================================================================
  // 1) ADMIN PLATEFORME
  // ==========================================================================
  const admin = await upsertUser(
    'seed-usr-admin',
    'admin@les-extras.fr',
    'Sitraka',
    'Admin',
    { role: GlobalRole.ADMIN },
  );

  // ==========================================================================
  // 2) ÉTABLISSEMENT #1 — MECS Les Hirondelles (+ sous-comptes + invitations)
  // ==========================================================================
  const mecsOwner = await upsertUser(
    'seed-usr-mecs-owner',
    'direction@mecs-hirondelles.fr',
    'Claire',
    'Fontaine',
    { phone: '01 64 10 20 30' },
  );
  const mecsManager = await upsertUser(
    'seed-usr-mecs-manager',
    'chefservice@mecs-hirondelles.fr',
    'Marc',
    'Delaunay',
  );
  const mecsRh = await upsertUser(
    'seed-usr-mecs-rh',
    'rh@mecs-hirondelles.fr',
    'Nadia',
    'Berger',
  );
  const mecsCoord = await upsertUser(
    'seed-usr-mecs-coord',
    'coordination@mecs-hirondelles.fr',
    'Julien',
    'Moreau',
  );

  const mecs = await prisma.account.upsert({
    where: { slug: 'mecs-les-hirondelles' },
    update: {},
    create: {
      id: 'seed-acc-mecs',
      name: 'MECS Les Hirondelles',
      type: AccountType.ESTABLISHMENT,
      slug: 'mecs-les-hirondelles',
      legalName: 'Association Les Hirondelles',
      siret: '78945612300021',
      address: '12 rue des Lilas',
      city: 'Melun',
      postalCode: '77000',
      phone: '01 64 10 20 30',
      credits: 25,
      ownerId: mecsOwner.id,
    },
  });

  await upsertMembership(mecsOwner.id, mecs.id, AccountRole.OWNER);
  await upsertMembership(mecsRh.id, mecs.id, AccountRole.ADMIN);
  await upsertMembership(mecsManager.id, mecs.id, AccountRole.MANAGER);
  await upsertMembership(mecsCoord.id, mecs.id, AccountRole.MEMBER);

  await prisma.invitation.upsert({
    where: { email_accountId: { email: 'educateur.nuit@mecs-hirondelles.fr', accountId: mecs.id } },
    update: {},
    create: {
      email: 'educateur.nuit@mecs-hirondelles.fr',
      accountId: mecs.id,
      role: AccountRole.MEMBER,
      token: 'seed-inv-mecs-1',
      status: InvitationStatus.PENDING,
      invitedById: mecsOwner.id,
      expiresAt: days(14),
    },
  });
  await prisma.invitation.upsert({
    where: { email_accountId: { email: 'psychologue@mecs-hirondelles.fr', accountId: mecs.id } },
    update: {},
    create: {
      email: 'psychologue@mecs-hirondelles.fr',
      accountId: mecs.id,
      role: AccountRole.MANAGER,
      token: 'seed-inv-mecs-2',
      status: InvitationStatus.PENDING,
      invitedById: mecsManager.id,
      expiresAt: days(14),
    },
  });

  // ==========================================================================
  // 3) ÉTABLISSEMENT #2 — IME Le Château (+ sous-comptes + invitation)
  // ==========================================================================
  const imeOwner = await upsertUser(
    'seed-usr-ime-owner',
    'direction@ime-lechateau.fr',
    'Philippe',
    'Garnier',
    { phone: '01 60 55 44 33' },
  );
  const imeManager = await upsertUser(
    'seed-usr-ime-manager',
    'coordination@ime-lechateau.fr',
    'Sophie',
    'Lambert',
  );
  const imeMember = await upsertUser(
    'seed-usr-ime-member',
    'educ@ime-lechateau.fr',
    'Karim',
    'Haddad',
  );

  const ime = await prisma.account.upsert({
    where: { slug: 'ime-le-chateau' },
    update: {},
    create: {
      id: 'seed-acc-ime',
      name: 'IME Le Château',
      type: AccountType.ESTABLISHMENT,
      slug: 'ime-le-chateau',
      legalName: 'Fondation Le Château',
      siret: '39876512400017',
      address: '5 avenue du Parc',
      city: 'Fontainebleau',
      postalCode: '77300',
      phone: '01 60 55 44 33',
      credits: 12,
      ownerId: imeOwner.id,
    },
  });

  await upsertMembership(imeOwner.id, ime.id, AccountRole.OWNER);
  await upsertMembership(imeManager.id, ime.id, AccountRole.MANAGER);
  await upsertMembership(imeMember.id, ime.id, AccountRole.MEMBER);

  await prisma.invitation.upsert({
    where: { email_accountId: { email: 'aes.remplacant@ime-lechateau.fr', accountId: ime.id } },
    update: {},
    create: {
      email: 'aes.remplacant@ime-lechateau.fr',
      accountId: ime.id,
      role: AccountRole.MEMBER,
      token: 'seed-inv-ime-1',
      status: InvitationStatus.PENDING,
      invitedById: imeOwner.id,
      expiresAt: days(10),
    },
  });

  // ==========================================================================
  // 4) FREELANCES (3) — compte perso + profil métier
  // ==========================================================================
  type FreelanceSeed = {
    uid: string;
    aid: string;
    email: string;
    firstName: string;
    lastName: string;
    slug: string;
    job: string;
    bio: string;
    skills: string[];
    city: string;
    postalCode: string;
    rate: string;
    siret: string;
  };

  const freelances: FreelanceSeed[] = [
    {
      uid: 'seed-usr-free-amina',
      aid: 'seed-acc-free-amina',
      email: 'amina.bensaid@example.com',
      firstName: 'Amina',
      lastName: 'Bensaïd',
      slug: 'amina-bensaid',
      job: 'Éducateur spécialisé',
      bio: "10 ans d'expérience en MECS et protection de l'enfance. Spécialisée en médiation animale.",
      skills: ['Protection de l\'enfance', 'Médiation animale', 'Gestion de crise'],
      city: 'Melun',
      postalCode: '77000',
      rate: '24.00',
      siret: '85212345600014',
    },
    {
      uid: 'seed-usr-free-thomas',
      aid: 'seed-acc-free-thomas',
      email: 'thomas.leroy@example.com',
      firstName: 'Thomas',
      lastName: 'Leroy',
      slug: 'thomas-leroy',
      job: 'Moniteur-éducateur',
      bio: 'Moniteur-éducateur en IME, passionné de sport adapté et d\'activités de plein air.',
      skills: ['Sport adapté', 'Handicap', 'Activités de plein air'],
      city: 'Fontainebleau',
      postalCode: '77300',
      rate: '21.50',
      siret: '84098765400028',
    },
    {
      uid: 'seed-usr-free-sarah',
      aid: 'seed-acc-free-sarah',
      email: 'sarah.cohen@example.com',
      firstName: 'Sarah',
      lastName: 'Cohen',
      slug: 'sarah-cohen',
      job: 'Éducatrice de jeunes enfants (EJE)',
      bio: 'EJE et art-thérapeute, interventions en SESSAD et ITEP.',
      skills: ['Art-thérapie', 'Petite enfance', 'ITEP'],
      city: 'Provins',
      postalCode: '77160',
      rate: '26.00',
      siret: '83011223300019',
    },
  ];

  const freelanceUsers: Record<string, { id: string }> = {};
  const freelanceAccounts: Record<string, { id: string }> = {};

  for (const f of freelances) {
    const u = await upsertUser(f.uid, f.email, f.firstName, f.lastName);
    freelanceUsers[f.slug] = u;

    await prisma.profile.upsert({
      where: { userId: u.id },
      update: { job: f.job, bio: f.bio, skills: f.skills },
      create: {
        userId: u.id,
        bio: f.bio,
        job: f.job,
        skills: f.skills,
        siret: f.siret,
        city: f.city,
        postalCode: f.postalCode,
        radiusKm: 40,
        hourlyRate: f.rate,
        available: true,
      },
    });

    const acc = await prisma.account.upsert({
      where: { slug: f.slug },
      update: {},
      create: {
        id: f.aid,
        name: `${f.firstName} ${f.lastName}`,
        type: AccountType.FREELANCE,
        slug: f.slug,
        siret: f.siret,
        city: f.city,
        postalCode: f.postalCode,
        ownerId: u.id,
      },
    });
    freelanceAccounts[f.slug] = acc;
    await upsertMembership(u.id, acc.id, AccountRole.OWNER);
  }

  const amina = freelanceUsers['amina-bensaid'];
  const aminaAcc = freelanceAccounts['amina-bensaid'];
  const thomas = freelanceUsers['thomas-leroy'];
  const thomasAcc = freelanceAccounts['thomas-leroy'];
  const sarah = freelanceUsers['sarah-cohen'];
  const sarahAcc = freelanceAccounts['sarah-cohen'];

  // ==========================================================================
  // 5) MISSIONS SOS RENFORT (statuts + visibilités variés)
  // ==========================================================================
  const missions = [
    {
      id: 'seed-mis-1',
      accountId: mecs.id,
      title: 'Renfort éducatif week-end — internat ados',
      description: "Remplacement d'un éducateur sur l'unité adolescents, nuits comprises.",
      category: MissionCategory.RENFORT,
      job: 'Éducateur spécialisé',
      startDate: days(3),
      endDate: days(5),
      startTime: '09h00',
      endTime: '21h00',
      city: 'Melun',
      postalCode: '77000',
      hourlyRate: '23.00',
      headcount: 1,
      status: MissionStatus.PUBLISHED,
      visibility: MissionVisibility.PUBLIC,
      publishedAt: new Date(),
    },
    {
      id: 'seed-mis-2',
      accountId: mecs.id,
      title: 'Remplacement congé maladie — unité 6-12 ans',
      description: 'Remplacement longue durée, prise de poste rapide souhaitée.',
      category: MissionCategory.REMPLACEMENT,
      job: 'Moniteur-éducateur',
      startDate: days(7),
      endDate: days(30),
      startTime: '08h00',
      endTime: '16h00',
      city: 'Melun',
      postalCode: '77000',
      hourlyRate: '21.00',
      headcount: 1,
      status: MissionStatus.PUBLISHED,
      visibility: MissionVisibility.SALARIES, // diffusion 1er cran : salariés
      publishedAt: new Date(),
    },
    {
      id: 'seed-mis-3',
      accountId: ime.id,
      title: 'AES en renfort — accompagnement repas et activités',
      description: 'Renfort ponctuel sur les temps forts de la journée.',
      category: MissionCategory.RENFORT,
      job: 'AES',
      startDate: days(2),
      endDate: days(2),
      startTime: '11h00',
      endTime: '15h00',
      city: 'Fontainebleau',
      postalCode: '77300',
      hourlyRate: '19.50',
      headcount: 2,
      status: MissionStatus.PUBLISHED,
      visibility: MissionVisibility.RESERVED, // 2e cran : freelances réservés
      publishedAt: new Date(),
    },
    {
      id: 'seed-mis-4',
      accountId: mecs.id,
      title: 'Analyse de pratiques — brouillon',
      description: 'Séance mensuelle d\'analyse de la pratique professionnelle (à finaliser).',
      category: MissionCategory.ANALYSE_PRATIQUES,
      job: 'Psychologue',
      startDate: days(20),
      startTime: '14h00',
      endTime: '16h00',
      city: 'Melun',
      postalCode: '77000',
      hourlyRate: '60.00',
      headcount: 1,
      status: MissionStatus.DRAFT,
      visibility: MissionVisibility.PUBLIC,
      publishedAt: null,
    },
    {
      id: 'seed-mis-5',
      accountId: ime.id,
      title: 'Renfort été — séjour adapté',
      description: 'Encadrement d\'un mini-séjour, mission pourvue.',
      category: MissionCategory.RENFORT,
      job: 'Moniteur-éducateur',
      startDate: days(1),
      endDate: days(6),
      startTime: '09h00',
      endTime: '18h00',
      city: 'Fontainebleau',
      postalCode: '77300',
      hourlyRate: '22.00',
      headcount: 1,
      status: MissionStatus.FILLED,
      visibility: MissionVisibility.PUBLIC,
      publishedAt: days(-4),
    },
    {
      id: 'seed-mis-6',
      accountId: ime.id,
      title: 'Renfort clôturé — remplacement mai',
      description: 'Mission passée, clôturée et facturée.',
      category: MissionCategory.REMPLACEMENT,
      job: 'Éducateur spécialisé',
      startDate: days(-30),
      endDate: days(-25),
      startTime: '09h00',
      endTime: '17h00',
      city: 'Fontainebleau',
      postalCode: '77300',
      hourlyRate: '23.00',
      headcount: 1,
      status: MissionStatus.CLOSED,
      visibility: MissionVisibility.PUBLIC,
      publishedAt: days(-40),
    },
  ];

  for (const m of missions) {
    await prisma.reliefMission.upsert({ where: { id: m.id }, update: {}, create: m });
  }

  // ==========================================================================
  // 6) SERVICES — Ateliers / Éducat'heures (freelances)
  // ==========================================================================
  const services = [
    {
      id: 'seed-svc-1',
      accountId: aminaAcc.id,
      title: 'Atelier médiation animale',
      description: 'Séances de médiation par l\'animal pour publics fragilisés.',
      category: ServiceCategory.MEDIATION,
      duration: '2H',
      maxParticipants: 8,
      publicTarget: 'Enfants et adolescents en MECS',
      price: '350.00',
      city: 'Melun',
      status: ServiceStatus.PUBLISHED,
    },
    {
      id: 'seed-svc-2',
      accountId: thomasAcc.id,
      title: "Éducat'heure — sport adapté",
      description: 'Cycle d\'activités physiques adaptées en établissement.',
      category: ServiceCategory.ATELIER,
      duration: '1H30',
      maxParticipants: 12,
      publicTarget: 'Adultes en situation de handicap',
      price: '180.00',
      city: 'Fontainebleau',
      status: ServiceStatus.PUBLISHED,
    },
    {
      id: 'seed-svc-3',
      accountId: sarahAcc.id,
      title: 'Atelier art-thérapie',
      description: 'Ateliers d\'expression artistique à visée thérapeutique.',
      category: ServiceCategory.ART_THERAPIE,
      duration: '2H',
      maxParticipants: 6,
      publicTarget: 'Jeunes en ITEP',
      price: '300.00',
      city: 'Provins',
      status: ServiceStatus.PUBLISHED,
    },
    {
      id: 'seed-svc-4',
      accountId: aminaAcc.id,
      title: 'Formation gestion de crise (brouillon)',
      description: 'Module de prévention et gestion des situations de violence.',
      category: ServiceCategory.FORMATION,
      duration: '7H',
      maxParticipants: 15,
      publicTarget: 'Équipes éducatives',
      price: '900.00',
      city: 'Melun',
      status: ServiceStatus.DRAFT,
    },
  ];

  for (const s of services) {
    await prisma.service.upsert({ where: { id: s.id }, update: {}, create: s });
  }

  // ==========================================================================
  // 7) BOOKINGS (réservations)
  // ==========================================================================
  // bk-1 : mission pourvue (freelance Thomas accepte la mission IME été)
  await prisma.booking.upsert({
    where: { id: 'seed-bk-1' },
    update: {},
    create: {
      id: 'seed-bk-1',
      accountId: thomasAcc.id,
      missionId: 'seed-mis-5',
      status: BookingStatus.CONFIRMED,
      scheduledAt: days(1),
      totalAmount: '990.00',
    },
  });

  // bk-2 : établissement MECS réserve l'atelier médiation animale d'Amina (terminé)
  await prisma.booking.upsert({
    where: { id: 'seed-bk-2' },
    update: {},
    create: {
      id: 'seed-bk-2',
      accountId: mecs.id,
      serviceId: 'seed-svc-1',
      status: BookingStatus.COMPLETED,
      scheduledAt: days(-10),
      totalAmount: '350.00',
    },
  });

  // bk-3 : candidature en attente sur mission publique MECS
  await prisma.booking.upsert({
    where: { id: 'seed-bk-3' },
    update: {},
    create: {
      id: 'seed-bk-3',
      accountId: aminaAcc.id,
      missionId: 'seed-mis-1',
      status: BookingStatus.REQUESTED,
    },
  });

  // bk-4 : mission clôturée réalisée par Amina pour l'IME (terminée)
  await prisma.booking.upsert({
    where: { id: 'seed-bk-4' },
    update: {},
    create: {
      id: 'seed-bk-4',
      accountId: aminaAcc.id,
      missionId: 'seed-mis-6',
      status: BookingStatus.COMPLETED,
      scheduledAt: days(-28),
      totalAmount: '920.00',
    },
  });

  // ==========================================================================
  // 8) AVIS BIDIRECTIONNELS (1 avis par booking ET par auteur)
  // ==========================================================================
  await prisma.review.upsert({
    where: { id: 'seed-rev-1' },
    update: {},
    create: {
      id: 'seed-rev-1',
      bookingId: 'seed-bk-2',
      authorId: mecsOwner.id, // établissement -> freelance
      targetId: amina.id,
      rating: 5,
      comment: 'Intervention remarquable, les jeunes ont adoré. Très professionnelle.',
    },
  });
  await prisma.review.upsert({
    where: { id: 'seed-rev-2' },
    update: {},
    create: {
      id: 'seed-rev-2',
      bookingId: 'seed-bk-4',
      authorId: amina.id, // freelance -> établissement
      targetId: imeOwner.id,
      rating: 4,
      comment: 'Équipe accueillante et cadre clair. Mission bien organisée.',
    },
  });

  // ==========================================================================
  // 9) MESSAGERIE (conversation liée à une mission)
  // ==========================================================================
  await prisma.conversation.upsert({
    where: { id: 'seed-conv-1' },
    update: {},
    create: { id: 'seed-conv-1', missionId: 'seed-mis-5' },
  });
  await prisma.message.upsert({
    where: { id: 'seed-msg-1' },
    update: {},
    create: {
      id: 'seed-msg-1',
      conversationId: 'seed-conv-1',
      senderId: imeOwner.id,
      body: 'Bonjour Thomas, merci pour votre candidature. Pouvez-vous confirmer vos disponibilités ?',
      readAt: new Date(),
    },
  });
  await prisma.message.upsert({
    where: { id: 'seed-msg-2' },
    update: {},
    create: {
      id: 'seed-msg-2',
      conversationId: 'seed-conv-1',
      senderId: thomas.id,
      body: 'Bonjour, avec plaisir. Je suis disponible sur toute la période du séjour.',
    },
  });

  // ==========================================================================
  // 10) NOTIFICATIONS
  // ==========================================================================
  const notifications = [
    {
      id: 'seed-ntf-1',
      userId: amina.id,
      type: 'MISSION_MATCH',
      title: 'Nouvelle mission près de chez vous',
      body: 'Renfort éducatif week-end — internat ados (Melun).',
      link: '/missions/seed-mis-1',
    },
    {
      id: 'seed-ntf-2',
      userId: mecsOwner.id,
      type: 'BOOKING_REQUEST',
      title: 'Nouvelle candidature reçue',
      body: 'Amina Bensaïd a candidaté à votre mission.',
      link: '/bookings/seed-bk-3',
    },
    {
      id: 'seed-ntf-3',
      userId: thomas.id,
      type: 'BOOKING_CONFIRMED',
      title: 'Mission confirmée',
      body: 'Votre mission « Renfort été — séjour adapté » est confirmée.',
      link: '/bookings/seed-bk-1',
      readAt: new Date(),
    },
  ];
  for (const n of notifications) {
    await prisma.notification.upsert({ where: { id: n.id }, update: {}, create: n });
  }

  // ==========================================================================
  // 11) FACTURE (rattachée au booking terminé bk-2)
  // ==========================================================================
  await prisma.invoice.upsert({
    where: { number: 'FAC-2026-0001' },
    update: {},
    create: {
      id: 'seed-inv-1',
      accountId: mecs.id,
      bookingId: 'seed-bk-2',
      number: 'FAC-2026-0001',
      amount: '350.00',
      status: InvoiceStatus.PAID,
      pdfUrl: '/invoices/FAC-2026-0001.pdf',
      issuedAt: days(-8),
    },
  });

  // ==========================================================================
  // 12) DOCUMENTS (coffre-fort conformité)
  // ==========================================================================
  const documents = [
    { id: 'seed-doc-1', userId: amina.id, kind: 'diploma', url: '/vault/amina-deis.pdf' },
    { id: 'seed-doc-2', userId: amina.id, kind: 'siret', url: '/vault/amina-siret.pdf' },
    { id: 'seed-doc-3', userId: thomas.id, kind: 'diploma', url: '/vault/thomas-dees.pdf' },
    { id: 'seed-doc-4', userId: mecsOwner.id, kind: 'contract', url: '/vault/mecs-cgu.pdf' },
  ];
  for (const d of documents) {
    await prisma.document.upsert({ where: { id: d.id }, update: {}, create: d });
  }

  // ---- Récap ---------------------------------------------------------------
  const counts = {
    users: await prisma.user.count(),
    accounts: await prisma.account.count(),
    memberships: await prisma.membership.count(),
    invitations: await prisma.invitation.count(),
    missions: await prisma.reliefMission.count(),
    services: await prisma.service.count(),
    bookings: await prisma.booking.count(),
    reviews: await prisma.review.count(),
    invoices: await prisma.invoice.count(),
  };
  console.log('✅ Seed terminé :', counts);
  console.log(`ℹ️  Comptes de démo — mot de passe : ${DEMO_PASSWORD}`);
  console.log(`   admin@les-extras.fr (ADMIN) · direction@mecs-hirondelles.fr (MECS)`);
  console.log(`   direction@ime-lechateau.fr (IME) · amina.bensaid@example.com (FREELANCE)`);
  void admin;
}

main()
  .catch((e) => {
    console.error('❌ Seed échoué :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
