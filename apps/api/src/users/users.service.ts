import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import {
  AccountType,
  BookingStatus,
  InvitationStatus,
  InvoiceStatus,
  MembershipStatus,
  MissionStatus,
  Prisma,
  ServiceStatus,
  SessionStatus,
  ShiftStatus,
  UserStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  AccountDeletionRequestDto,
  DELETION_CONFIRMATION_PHRASE,
} from './dto/privacy.dto';

/** Même coût bcrypt que AuthService : un seul standard de hachage dans l'app. */
const BCRYPT_ROUNDS = 12;

/** Plafond des listes volumineuses dans l'export RGPD (taille de fichier). */
const MAX_EXPORT_ROWS = 2000;

const USER_PUBLIC_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  avatarUrl: true,
  role: true,
  status: true,
  emailVerified: true,
  onboardingStep: true,
  createdAt: true,
  profile: true,
  qualifications: { orderBy: { createdAt: 'desc' } },
  experiences: { orderBy: { createdAt: 'desc' } },
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Profil complet de l'utilisateur courant. */
  getMe(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: USER_PUBLIC_SELECT,
    });
  }

  /** Met à jour l'identité (User) et le profil étendu (Profile) en une transaction. */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const userData: Prisma.UserUpdateInput = {};
    if (dto.firstName !== undefined) userData.firstName = dto.firstName;
    if (dto.lastName !== undefined) userData.lastName = dto.lastName;
    if (dto.phone !== undefined) userData.phone = dto.phone;
    if (dto.avatarUrl !== undefined) userData.avatarUrl = dto.avatarUrl;

    const profileData: Prisma.ProfileUpdateWithoutUserInput = {};
    if (dto.bio !== undefined) profileData.bio = dto.bio;
    if (dto.job !== undefined) profileData.job = dto.job;
    if (dto.skills !== undefined) profileData.skills = dto.skills;
    if (dto.siret !== undefined) profileData.siret = dto.siret;
    if (dto.diplomaUrl !== undefined) profileData.diplomaUrl = dto.diplomaUrl;
    if (dto.city !== undefined) profileData.city = dto.city;
    if (dto.postalCode !== undefined) profileData.postalCode = dto.postalCode;
    if (dto.radiusKm !== undefined) profileData.radiusKm = dto.radiusKm;
    if (dto.hourlyRate !== undefined)
      profileData.hourlyRate = new Prisma.Decimal(dto.hourlyRate);
    if (dto.available !== undefined) profileData.available = dto.available;

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...userData,
        profile: {
          upsert: {
            create: { ...(profileData as unknown as Prisma.ProfileCreateWithoutUserInput) },
            update: profileData,
          },
        },
      },
      select: USER_PUBLIC_SELECT,
    });
  }

  /** Avance (ou fixe) l'étape d'onboarding de l'utilisateur. */
  setOnboardingStep(userId: string, step: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { onboardingStep: step },
      select: { id: true, onboardingStep: true },
    });
  }

  // ── CV : diplômes & expériences (freelance) ────────────────────────────────
  listCv(userId: string) {
    return this.prisma.user
      .findUniqueOrThrow({
        where: { id: userId },
        select: {
          qualifications: { orderBy: { createdAt: 'desc' } },
          experiences: { orderBy: { createdAt: 'desc' } },
        },
      });
  }

  addQualification(
    userId: string,
    data: { title: string; organization?: string; year?: string },
  ) {
    return this.prisma.qualification.create({
      data: { userId, title: data.title, organization: data.organization, year: data.year },
    });
  }

  async removeQualification(userId: string, id: string) {
    // deleteMany borne la suppression au propriétaire (pas de fuite inter-comptes).
    const res = await this.prisma.qualification.deleteMany({ where: { id, userId } });
    return { deleted: res.count };
  }

  addExperience(
    userId: string,
    data: { title: string; year?: string; description?: string },
  ) {
    return this.prisma.experience.create({
      data: { userId, title: data.title, year: data.year, description: data.description },
    });
  }

  async removeExperience(userId: string, id: string) {
    const res = await this.prisma.experience.deleteMany({ where: { id, userId } });
    return { deleted: res.count };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RGPD — DROIT D'ACCÈS & PORTABILITÉ (art. 15 et 20)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Construit l'export complet des données personnelles de l'utilisateur.
   *
   * Règles appliquées :
   *  - le mot de passe (même haché) et tous les jetons (JWT, token
   *    d'invitation…) sont EXCLUS : ce sont des secrets d'authentification, pas
   *    des données personnelles à restituer ;
   *  - les données d'une structure (compte ESTABLISHMENT) ne sont PAS incluses :
   *    elles appartiennent à la personne morale, et les y verser reviendrait à
   *    livrer les données de tiers (collègues, intervenants) dans un export
   *    individuel. Seul le rattachement de la personne au compte figure ici ;
   *  - les listes très volumineuses (messages, notifications, journal) sont
   *    bornées à MAX_EXPORT_ROWS, ce qui est signalé dans le fichier.
   */
  async exportPersonalData(userId: string) {
    const generatedAt = new Date();

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      // Sélection en liste blanche : `password` n'est jamais lu.
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        status: true,
        emailVerified: true,
        onboardingStep: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
        qualifications: { orderBy: { createdAt: 'desc' } },
        experiences: { orderBy: { createdAt: 'desc' } },
        availabilities: { orderBy: { createdAt: 'desc' } },
        documents: { orderBy: { createdAt: 'desc' } },
        notifications: { orderBy: { createdAt: 'desc' }, take: MAX_EXPORT_ROWS },
        complianceDocuments: {
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            type: true,
            label: true,
            status: true,
            fileUrl: true,
            issuedAt: true,
            expiresAt: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
            account: { select: { id: true, name: true } },
          },
        },
        memberships: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            role: true,
            status: true,
            createdAt: true,
            orgUnit: { select: { id: true, name: true } },
            account: {
              select: {
                id: true,
                name: true,
                type: true,
                slug: true,
                ownerId: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    const ownedAccounts = user.memberships
      .map((m) => m.account)
      .filter((a) => a.ownerId === userId);
    // Seuls les comptes FREELANCE dont la personne est propriétaire portent
    // des données réellement « personnelles » (le compte, c'est elle).
    const soloAccountIds = ownedAccounts
      .filter((a) => a.type === AccountType.FREELANCE)
      .map((a) => a.id);

    const [
      bookings,
      invoices,
      shifts,
      messages,
      reviewsAuthored,
      reviewsReceived,
      inscriptions,
      sessionsTrained,
      tutoratsGiven,
      sentInvitations,
      articles,
      auditTrail,
    ] = await Promise.all([
      this.prisma.booking.findMany({
        where: {
          OR: [
            { accountId: { in: soloAccountIds } },
            { shift: { is: { freelanceId: userId } } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          scheduledAt: true,
          totalAmount: true,
          cancelReason: true,
          signedFreelanceAt: true,
          signedEstablishmentAt: true,
          createdAt: true,
          mission: {
            select: {
              id: true,
              title: true,
              job: true,
              startDate: true,
              endDate: true,
              city: true,
              postalCode: true,
              hourlyRate: true,
              account: { select: { id: true, name: true } },
            },
          },
          service: { select: { id: true, title: true, category: true } },
          invoice: {
            select: { number: true, amount: true, status: true, issuedAt: true },
          },
          timeEntries: {
            orderBy: { startedAt: 'asc' },
            select: {
              id: true,
              startedAt: true,
              endedAt: true,
              note: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.invoice.findMany({
        where: { accountId: { in: soloAccountIds } },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          number: true,
          amount: true,
          status: true,
          pdfUrl: true,
          issuedAt: true,
          createdAt: true,
          account: { select: { id: true, name: true } },
        },
      }),
      this.prisma.shift.findMany({
        where: { freelanceId: userId },
        orderBy: { startAt: 'desc' },
        select: {
          id: true,
          title: true,
          startAt: true,
          endAt: true,
          status: true,
          notes: true,
          account: { select: { id: true, name: true } },
          mission: { select: { id: true, title: true } },
        },
      }),
      this.prisma.message.findMany({
        where: { senderId: userId },
        orderBy: { createdAt: 'desc' },
        take: MAX_EXPORT_ROWS,
        select: {
          id: true,
          conversationId: true,
          body: true,
          readAt: true,
          createdAt: true,
          conversation: {
            select: { mission: { select: { id: true, title: true } } },
          },
        },
      }),
      this.prisma.review.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          bookingId: true,
          rating: true,
          comment: true,
          createdAt: true,
        },
      }),
      this.prisma.review.findMany({
        where: { targetId: userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          bookingId: true,
          rating: true,
          comment: true,
          createdAt: true,
        },
      }),
      this.prisma.inscription.findMany({
        where: { learnerId: userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          financing: true,
          satisfaction: true,
          evalResult: true,
          attestationUrl: true,
          certificatUrl: true,
          learnerName: true,
          learnerEmail: true,
          createdAt: true,
          session: {
            select: {
              id: true,
              title: true,
              startDate: true,
              endDate: true,
              location: true,
              formation: { select: { title: true, durationHours: true } },
            },
          },
          emargements: {
            orderBy: { slotDate: 'asc' },
            select: {
              id: true,
              slotDate: true,
              slot: true,
              present: true,
              signedAt: true,
            },
          },
          tutorat: {
            select: { id: true, status: true, projetAvenir: true },
          },
        },
      }),
      this.prisma.formationSession.findMany({
        where: { trainerId: userId },
        orderBy: { startDate: 'desc' },
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
          location: true,
          status: true,
          formation: { select: { id: true, title: true } },
        },
      }),
      this.prisma.tutorat.findMany({
        where: { tutorId: userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          projetAvenir: true,
          createdAt: true,
          entretiens: {
            orderBy: { date: 'asc' },
            select: { id: true, date: true, notes: true },
          },
          jalons: {
            orderBy: { createdAt: 'asc' },
            select: { id: true, label: true, dueDate: true, status: true },
          },
        },
      }),
      this.prisma.invitation.findMany({
        where: { invitedById: userId },
        orderBy: { createdAt: 'desc' },
        // `token` volontairement exclu : c'est un secret, pas une donnée perso.
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          expiresAt: true,
          acceptedAt: true,
          createdAt: true,
          account: { select: { id: true, name: true } },
        },
      }),
      this.prisma.article.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          publishedAt: true,
          createdAt: true,
        },
      }),
      this.prisma.auditLog.findMany({
        where: { actorId: userId },
        orderBy: { createdAt: 'desc' },
        take: MAX_EXPORT_ROWS,
        select: {
          id: true,
          createdAt: true,
          action: true,
          entityType: true,
          entityId: true,
          summary: true,
          ip: true,
        },
      }),
    ]);

    const tronques: string[] = [];
    if (user.notifications.length === MAX_EXPORT_ROWS)
      tronques.push('notifications');
    if (messages.length === MAX_EXPORT_ROWS) tronques.push('messagesEnvoyes');
    if (auditTrail.length === MAX_EXPORT_ROWS) tronques.push('journalDActivite');

    const payload = {
      _lisezMoi: {
        titre: 'Export de vos données personnelles — Les Extras',
        genereLe: generatedAt.toISOString(),
        aProposDeCeFichier:
          "Ce fichier contient l'ensemble des données personnelles que Les Extras conserve à votre sujet, au format JSON (lisible par un humain et réutilisable par un autre service). Il est délivré au titre du droit d'accès (article 15 du RGPD) et du droit à la portabilité (article 20 du RGPD).",
        ceQuiNEstPasInclus: [
          "Votre mot de passe : il n'est stocké que sous forme chiffrée et irréversible, et ne constitue pas une donnée à restituer.",
          "Les jetons techniques (jeton de session, jeton d'invitation) : ce sont des clés d'accès, leur divulgation serait un risque de sécurité.",
          "Les données propres à une structure (établissement) dont vous êtes membre : elles appartiennent à la personne morale et concernent aussi vos collègues. Seul votre rattachement à cette structure figure ici.",
        ],
        listesTronquees:
          tronques.length > 0
            ? `Pour limiter la taille du fichier, les listes suivantes sont limitées aux ${MAX_EXPORT_ROWS} éléments les plus récents : ${tronques.join(', ')}. Contactez-nous pour obtenir l'intégralité.`
            : 'Aucune liste n\'a été tronquée : cet export est intégral.',
        quoiFaireEnsuite:
          "Vous pouvez conserver ce fichier, le transmettre à un autre service ou nous écrire si une donnée vous paraît inexacte : vous avez le droit de la faire rectifier (article 16 du RGPD).",
        sommaire: {
          identite: 'Vos informations de connexion et d\'identité (nom, e-mail, téléphone, photo, date de création du compte).',
          profilProfessionnel: 'Votre profil d\'intervenant : métier, présentation, compétences, SIRET, zone d\'intervention, tarif horaire.',
          cv: 'Vos diplômes et vos expériences professionnelles déclarés sur la plateforme.',
          disponibilites: 'Les créneaux de disponibilité (ou d\'indisponibilité) que vous avez déclarés.',
          rattachementsAuxComptes: 'Les comptes (structures ou compte individuel) auxquels vous êtes rattaché, avec votre rôle et votre unité.',
          piecesDeConformite: 'Le suivi de vos pièces obligatoires (identité, casier judiciaire, permis, IBAN, attestations). Seul le suivi figure ici, pas les fichiers eux-mêmes : ils restent accessibles via leur lien.',
          fichiersDeposes: 'Les fichiers que vous avez déposés (photo, diplôme, documents divers), sous forme de liens.',
          missionsEtReservations: 'Vos missions et ateliers réservés, avec le détail de vos pointages (heures déclarées et validées) et la facture associée.',
          creneauxPlanifies: 'Les créneaux de planning sur lesquels vous avez été positionné par une structure.',
          factures: 'Les factures rattachées à votre compte individuel.',
          avisDeposes: 'Les avis que vous avez laissés après une mission.',
          avisRecus: 'Les avis laissés à votre sujet après une mission.',
          messagesEnvoyes: 'Les messages que vous avez envoyés dans la messagerie de la plateforme.',
          notifications: 'Les notifications qui vous ont été adressées.',
          formation: 'Vos inscriptions en formation, vos émargements, les sessions que vous avez animées et vos accompagnements de tutorat.',
          invitationsEnvoyees: 'Les invitations que vous avez envoyées pour faire rejoindre un compte.',
          articlesRediges: 'Les articles publiés sous votre signature.',
          journalDActivite: 'La trace des actions sensibles que vous avez effectuées sur la plateforme (traçabilité).',
        },
      },

      identite: {
        id: user.id,
        email: user.email,
        prenom: user.firstName,
        nom: user.lastName,
        telephone: user.phone,
        photo: user.avatarUrl,
        rolePlateforme: user.role,
        statutDuCompte: user.status,
        emailVerifie: user.emailVerified,
        etapeOnboarding: user.onboardingStep,
        derniereConnexion: user.lastLoginAt,
        compteCreeLe: user.createdAt,
        derniereModification: user.updatedAt,
      },

      profilProfessionnel: user.profile,

      cv: {
        diplomes: user.qualifications,
        experiences: user.experiences,
      },

      disponibilites: user.availabilities,

      rattachementsAuxComptes: user.memberships.map((m) => ({
        role: m.role,
        statut: m.status,
        rattacheDepuis: m.createdAt,
        unite: m.orgUnit?.name ?? null,
        compte: {
          id: m.account.id,
          nom: m.account.name,
          type: m.account.type,
          vousEtesProprietaire: m.account.ownerId === userId,
        },
      })),

      piecesDeConformite: user.complianceDocuments,
      fichiersDeposes: user.documents,

      missionsEtReservations: bookings,
      creneauxPlanifies: shifts,
      factures: invoices,

      avisDeposes: reviewsAuthored,
      avisRecus: reviewsReceived,
      messagesEnvoyes: messages,
      notifications: user.notifications,

      formation: {
        inscriptions,
        sessionsAnimees: sessionsTrained,
        tutoratsAssures: tutoratsGiven,
      },

      invitationsEnvoyees: sentInvitations,
      articlesRediges: articles,
      journalDActivite: auditTrail,
    };

    const stamp = generatedAt.toISOString().slice(0, 10);
    return {
      fileName: `les-extras_mes-donnees-personnelles_${stamp}.json`,
      // Indenté : le fichier doit rester lisible tel quel dans un éditeur.
      body: JSON.stringify(payload, null, 2),
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RGPD — DROIT À L'EFFACEMENT (art. 17) : ANONYMISATION IRRÉVERSIBLE
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Traite une demande de suppression de compte.
   *
   * Pourquoi une ANONYMISATION et non une suppression physique ?
   * Les factures et les heures de travail validées sont des pièces comptables :
   * le code de commerce (art. L123-22) impose de les conserver 10 ans, et le
   * droit du travail impose de conserver la trace des heures effectuées. Une
   * suppression en cascade détruirait la comptabilité des structures clientes,
   * qui ne sont pas concernées par la demande. L'article 17.3 du RGPD prévoit
   * expressément cette limite (obligation légale de conservation).
   *
   * On applique donc la seule réponse conforme : effacer tout ce qui identifie
   * la personne, conserver les écritures qui doivent l'être, et désactiver le
   * compte définitivement.
   */
  async requestAccountDeletion(
    userId: string,
    dto: AccountDeletionRequestDto,
    ip?: string | null,
  ) {
    // ── 1. Phrase de confirmation (geste délibéré) ───────────────────────────
    const typed = dto.confirmation.trim().replace(/\s+/g, ' ').toUpperCase();
    if (typed !== DELETION_CONFIRMATION_PHRASE) {
      throw new BadRequestException(
        `La phrase de confirmation ne correspond pas. Recopiez exactement : « ${DELETION_CONFIRMATION_PHRASE} ».`,
      );
    }

    // ── 2. Mot de passe (preuve que c'est bien le titulaire) ─────────────────
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        password: true,
        status: true,
        memberships: {
          select: {
            id: true,
            status: true,
            account: { select: { id: true, name: true, type: true, ownerId: true } },
          },
        },
      },
    });
    if (!user) {
      throw new NotFoundException('Compte introuvable.');
    }
    if (user.status === UserStatus.ANONYMIZED) {
      throw new ConflictException(
        'Ce compte est déjà désactivé. Aucune action supplémentaire n\'est possible.',
      );
    }

    // Même mécanisme que la connexion (bcryptjs, cf. AuthService.login).
    const passwordOk = await bcrypt.compare(dto.password, user.password);
    if (!passwordOk) {
      throw new UnauthorizedException(
        'Mot de passe incorrect. La suppression n\'a pas été effectuée.',
      );
    }

    // ── 3. Garde-fous métier : rien en cours, rien d'impayé ──────────────────
    const ownedAccounts = user.memberships
      .map((m) => m.account)
      .filter((a) => a.ownerId === userId);
    const ownedAccountIds = ownedAccounts.map((a) => a.id);
    const ownedFreelanceAccountIds = ownedAccounts
      .filter((a) => a.type === AccountType.FREELANCE)
      .map((a) => a.id);
    const now = new Date();

    const [activeBookings, unpaidInvoices, upcomingShifts, upcomingSessions] =
      await Promise.all([
        this.prisma.booking.count({
          where: {
            status: {
              in: [
                BookingStatus.REQUESTED,
                BookingStatus.ACCEPTED,
                BookingStatus.CONFIRMED,
                BookingStatus.IN_PROGRESS,
              ],
            },
            OR: [
              { accountId: { in: ownedAccountIds } },
              { mission: { accountId: { in: ownedAccountIds } } },
              { service: { accountId: { in: ownedAccountIds } } },
              { shift: { is: { freelanceId: userId } } },
            ],
          },
        }),
        this.prisma.invoice.count({
          where: {
            accountId: { in: ownedAccountIds },
            status: InvoiceStatus.ISSUED,
          },
        }),
        this.prisma.shift.count({
          where: {
            freelanceId: userId,
            status: { in: [ShiftStatus.PLANNED, ShiftStatus.CONFIRMED] },
            endAt: { gte: now },
          },
        }),
        this.prisma.formationSession.count({
          where: {
            trainerId: userId,
            status: {
              in: [
                SessionStatus.SCHEDULED,
                SessionStatus.OPEN,
                SessionStatus.FULL,
                SessionStatus.RUNNING,
              ],
            },
            OR: [{ endDate: { gte: now } }, { endDate: null, startDate: { gte: now } }],
          },
        }),
      ]);

    const blocages: string[] = [];
    if (activeBookings > 0) {
      blocages.push(
        `${activeBookings} mission(s) ou réservation(s) sont encore en cours. Terminez-les ou annulez-les : une structure compte peut-être sur vous.`,
      );
    }
    if (upcomingShifts > 0) {
      blocages.push(
        `${upcomingShifts} créneau(x) de planning à venir vous sont attribués. Faites-vous remplacer avant de partir.`,
      );
    }
    if (upcomingSessions > 0) {
      blocages.push(
        `${upcomingSessions} session(s) de formation à venir vous ont pour formateur. Un remplaçant doit être désigné.`,
      );
    }
    if (unpaidInvoices > 0) {
      blocages.push(
        `${unpaidInvoices} facture(s) émise(s) ne sont pas encore réglées. Le règlement doit être soldé avant l'anonymisation, car ensuite plus personne ne pourra rattacher ces montants à un interlocuteur.`,
      );
    }

    // Un compte ne doit jamais se retrouver sans propriétaire.
    for (const account of ownedAccounts) {
      const otherActiveMembers = await this.prisma.membership.count({
        where: {
          accountId: account.id,
          userId: { not: userId },
          status: MembershipStatus.ACTIVE,
        },
      });
      if (otherActiveMembers > 0) {
        blocages.push(
          `Vous êtes propriétaire du compte « ${account.name} », qui compte encore ${otherActiveMembers} autre(s) membre(s) actif(s). Transférez la propriété à un collègue avant de partir, sinon leur accès serait perdu.`,
        );
      }
    }

    if (blocages.length > 0) {
      // Le filtre d'exception global n'expose que `message` : on assemble donc
      // un texte unique, en français, lisible tel quel dans l'interface.
      const detail = blocages.map((b) => `\u2022 ${b}`).join('\n');
      throw new ConflictException(
        `Votre demande de suppression ne peut pas être traitée en l'état :\n${detail}\n\nRéglez ces points puis relancez la demande. Si vous êtes bloqué, écrivez-nous : nous traiterons votre demande manuellement, dans le délai légal d'un mois.`,
      );
    }

    // ── 4. Anonymisation (transactionnelle) ─────────────────────────────────
    const suffix = randomBytes(6).toString('hex');
    // TLD `.invalid` (RFC 2606) : garantit qu'aucun e-mail ne partira jamais
    // vers cette adresse, tout en respectant la contrainte d'unicité.
    const neutralEmail = `anonyme-${suffix}@donnees-effacees.invalid`;
    // Mot de passe aléatoire jamais communiqué : la connexion devient impossible
    // même si le statut du compte était un jour rouvert par erreur.
    const neutralPassword = await bcrypt.hash(
      randomBytes(32).toString('hex'),
      BCRYPT_ROUNDS,
    );

    const efface = await this.prisma.$transaction(async (tx) => {
      // a) Pièces les plus sensibles : CNI, casier judiciaire (B3), IBAN,
      //    permis, attestations. Aucune obligation de conservation ne pèse sur
      //    la plateforme une fois la relation terminée : on supprime les lignes.
      const conformite = await tx.complianceDocument.deleteMany({ where: { userId } });
      // b) Fichiers déposés (photo, diplôme…).
      const fichiers = await tx.document.deleteMany({ where: { userId } });
      // c) CV, disponibilités, notifications : purement personnels.
      const diplomes = await tx.qualification.deleteMany({ where: { userId } });
      const experiences = await tx.experience.deleteMany({ where: { userId } });
      const dispos = await tx.availability.deleteMany({ where: { userId } });
      const notifs = await tx.notification.deleteMany({ where: { userId } });

      // d) Invitations encore en attente : révoquées (elles portent l'adresse
      //    e-mail d'un tiers et n'ont plus d'émetteur légitime).
      const invitations = await tx.invitation.updateMany({
        where: { invitedById: userId, status: InvitationStatus.PENDING },
        data: { status: InvitationStatus.REVOKED },
      });

      // e) Profil vidé (bio, métier, compétences, SIRET, adresse, tarif).
      await tx.profile.updateMany({
        where: { userId },
        data: {
          bio: null,
          job: null,
          skills: { set: [] },
          siret: null,
          diplomaUrl: null,
          city: null,
          postalCode: null,
          radiusKm: null,
          hourlyRate: null,
          available: false,
        },
      });

      // f) Plus rien de publié sous son nom : ateliers archivés, missions
      //    encore ouvertes annulées, articles désolidarisés de leur auteur.
      const ateliers = await tx.service.updateMany({
        where: {
          accountId: { in: ownedFreelanceAccountIds },
          status: { in: [ServiceStatus.DRAFT, ServiceStatus.PUBLISHED] },
        },
        data: { status: ServiceStatus.ARCHIVED },
      });
      const missions = await tx.reliefMission.updateMany({
        where: {
          accountId: { in: ownedAccountIds },
          status: { in: [MissionStatus.DRAFT, MissionStatus.PUBLISHED] },
        },
        data: { status: MissionStatus.CANCELLED },
      });
      const articles = await tx.article.updateMany({
        where: { authorId: userId },
        data: { authorId: null },
      });

      // g) Accès coupés : les rattachements passent en SUSPENDED (on ne les
      //    supprime pas, ils portent l'historique des missions facturées).
      const rattachements = await tx.membership.updateMany({
        where: { userId },
        data: { status: MembershipStatus.SUSPENDED },
      });

      // h) Identité neutralisée + compte fermé. Le statut ANONYMIZED marque un
      //    effacement demandé par la personne — volontairement distinct de
      //    BANNED, qui est une sanction. Il est revérifié à CHAQUE requête par
      //    JwtStrategy, donc tous les jetons encore en circulation cessent
      //    immédiatement de fonctionner.
      await tx.user.update({
        where: { id: userId },
        data: {
          email: neutralEmail,
          firstName: 'Utilisateur',
          lastName: 'anonymisé',
          phone: null,
          avatarUrl: null,
          password: neutralPassword,
          status: UserStatus.ANONYMIZED,
          emailVerified: false,
          lastLoginAt: null,
          onboardingStep: 0,
        },
      });

      return {
        piecesDeConformite: conformite.count,
        fichiersDeposes: fichiers.count,
        diplomes: diplomes.count,
        experiences: experiences.count,
        disponibilites: dispos.count,
        notifications: notifs.count,
        invitationsRevoquees: invitations.count,
        ateliersArchives: ateliers.count,
        missionsAnnulees: missions.count,
        articlesDesolidarises: articles.count,
        rattachementsSuspendus: rattachements.count,
      };
    },
    // Une douzaine d'écritures sur des tables potentiellement volumineuses :
    // le défaut de 5 s de Prisma est trop court pour un compte très actif.
    { timeout: 20_000 });

    // ── 5. Traçabilité : on garde la preuve que la demande a été honorée ─────
    // (sans jamais réintroduire l'identité effacée dans le journal).
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: userId,
          action: 'user.gdpr.anonymized',
          entityType: 'User',
          entityId: userId,
          summary:
            "Demande de suppression RGPD honorée : compte anonymisé et désactivé, écritures comptables conservées.",
          metadata: efface as unknown as Prisma.InputJsonValue,
          ip: ip ?? null,
        },
      });
    } catch (error) {
      // La perte de traçabilité ne doit jamais annuler l'effacement obtenu.
      this.logger.warn(
        `Anonymisation RGPD ${userId} : journal d'audit non écrit (${
          error instanceof Error ? error.message : String(error)
        }).`,
      );
    }

    this.logger.log(`Anonymisation RGPD effectuée pour l'utilisateur ${userId}.`);

    return {
      anonymise: true,
      effectueLe: new Date().toISOString(),
      efface,
      conserve: [
        'Les factures et leurs montants, ainsi que les heures de travail validées : obligation de conservation comptable (10 ans) et sociale. Elles ne portent plus votre nom mais restent rattachées aux écritures.',
        "Les avis échangés après mission et les messages de la messagerie : ils appartiennent aussi à votre interlocuteur, qui a le droit de conserver son historique.",
        'Vos dossiers de formation (inscriptions, émargements, attestations) : la certification Qualiopi impose de pouvoir les présenter en audit.',
        "Le journal d'audit des actions sensibles, dont la trace de la présente demande.",
      ],
      message:
        "Votre compte est anonymisé et désactivé. Vous allez être déconnecté et ne pourrez plus vous reconnecter. Cette opération est définitive.",
    };
  }
}
