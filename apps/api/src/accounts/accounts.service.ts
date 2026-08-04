import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AccountRole,
  AccountType,
  MembershipStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { slugify, randomSuffix } from '../common/utils/slug.util';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Vérifie que l'utilisateur est membre ACTIF du compte et, si des rôles
   * sont exigés, qu'il détient l'un d'eux. Base de l'isolation multi-tenant
   * pour toutes les routes /accounts/:id.
   */
  private async requireMembership(
    userId: string,
    accountId: string,
    roles?: AccountRole[],
  ) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_accountId: { userId, accountId } },
    });

    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      // Ne pas divulguer l'existence du compte.
      throw new ForbiddenException("Accès refusé à ce compte.");
    }

    if (roles && roles.length > 0 && !roles.includes(membership.role)) {
      throw new ForbiddenException(
        `Rôle insuffisant (requis : ${roles.join(' | ')}).`,
      );
    }

    return membership;
  }

  /** Comptes accessibles par l'utilisateur (memberships actifs). */
  async findMine(userId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { userId, status: MembershipStatus.ACTIVE },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        account: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            logoUrl: true,
            credits: true,
            city: true,
          },
        },
      },
    });
    return memberships.map((m) => ({ ...m.account, membershipRole: m.role }));
  }

  /**
   * Recherche d'établissements par nom — pour un compte « salarié » qui
   * choisit à qui envoyer sa demande de rattachement. Authentifié (JwtAuthGuard
   * au niveau du contrôleur) mais volontairement sans restriction de rôle :
   * une personne doit pouvoir trouver n'importe quel établissement de la
   * plateforme, pas seulement ceux où elle a déjà un accès. Réponse minimale
   * (pas d'email, de coordonnées bancaires, etc.) : c'est un annuaire, pas
   * une fiche complète.
   */
  async searchEstablishments(q: string) {
    const query = q.trim();
    if (query.length < 2) return [];
    return this.prisma.account.findMany({
      where: {
        type: AccountType.ESTABLISHMENT,
        name: { contains: query, mode: Prisma.QueryMode.insensitive },
      },
      select: { id: true, name: true, city: true, logoUrl: true },
      orderBy: { name: 'asc' },
      take: 20,
    });
  }

  async findOne(userId: string, accountId: string) {
    await this.requireMembership(userId, accountId);
    return this.prisma.account.findUniqueOrThrow({ where: { id: accountId } });
  }

  /** Crée un nouveau compte ; le créateur en devient OWNER. */
  async create(userId: string, dto: CreateAccountDto) {
    const slug = await this.generateUniqueSlug(dto.name);

    return this.prisma.$transaction(async (tx) => {
      const account = await tx.account.create({
        data: {
          name: dto.name,
          type: dto.type,
          slug,
          legalName: dto.legalName,
          siret: dto.siret,
          address: dto.address,
          city: dto.city,
          postalCode: dto.postalCode,
          phone: dto.phone,
          logoUrl: dto.logoUrl,
          ownerId: userId,
        },
      });

      await tx.membership.create({
        data: {
          userId,
          accountId: account.id,
          role: AccountRole.OWNER,
          status: MembershipStatus.ACTIVE,
        },
      });

      return account;
    });
  }

  /**
   * Bascule salarié → intervenant.
   *
   * Un salarié d'établissement peut proposer ses interventions en son nom
   * propre : on lui crée un compte FREELANCE dont il est OWNER, et on recopie
   * les fiches qu'il désigne. Les copies partent en BROUILLON — il les relit et
   * les publie lui-même, on ne met jamais en ligne à sa place.
   *
   * Idempotent : si l'utilisateur possède déjà un compte intervenant, on le
   * réutilise plutôt que d'en empiler un second.
   */
  async devenirIntervenant(
    userId: string,
    dto: {
      name: string;
      contactEmail: string;
      phone: string;
      sourceAccountId?: string;
      serviceIds?: string[];
    },
  ) {
    const email = dto.contactEmail.trim().toLowerCase();
    const tel = dto.phone.replace(/[\s.-]/g, '');

    // Garde-fou : une activité indépendante ne se pilote pas depuis la
    // messagerie ni la ligne de son employeur. On refuse les coordonnées de la
    // structure source, et l'adresse professionnelle de connexion.
    const [utilisateur, source] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
      dto.sourceAccountId
        ? this.prisma.account.findUnique({
            where: { id: dto.sourceAccountId },
            select: { phone: true, contactEmail: true, owner: { select: { email: true } } },
          })
        : Promise.resolve(null),
    ]);

    const emailsInterdits = [
      utilisateur?.email,
      source?.contactEmail,
      source?.owner?.email,
    ]
      .filter(Boolean)
      .map((e) => (e as string).trim().toLowerCase());

    if (emailsInterdits.includes(email)) {
      throw new BadRequestException(
        'Utilisez une adresse e-mail personnelle : les demandes liées à votre activité indépendante ne doivent pas arriver sur la messagerie de votre employeur.',
      );
    }

    if (source?.phone && source.phone.replace(/[\s.-]/g, '') === tel) {
      throw new BadRequestException(
        'Utilisez un numéro de téléphone personnel, distinct de celui de votre structure.',
      );
    }

    const existant = await this.prisma.membership.findFirst({
      where: { userId, status: MembershipStatus.ACTIVE, account: { type: AccountType.FREELANCE } },
      select: { account: { select: { id: true, name: true, slug: true, type: true } } },
    });

    const compte =
      existant?.account ??
      (await this.create(userId, {
        name: dto.name,
        type: AccountType.FREELANCE,
        phone: dto.phone,
      } as CreateAccountDto));

    // Le contact personnel est posé (ou rafraîchi) à chaque passage.
    await this.prisma.account.update({
      where: { id: compte.id },
      data: { contactEmail: email, phone: dto.phone },
    });

    let importees = 0;
    if (dto.sourceAccountId && dto.serviceIds?.length) {
      // L'utilisateur doit être membre actif du compte source : on ne recopie
      // jamais le catalogue d'une structure à laquelle il n'appartient pas.
      await this.requireMembership(userId, dto.sourceAccountId);
      const fiches = await this.prisma.service.findMany({
        where: { id: { in: dto.serviceIds }, accountId: dto.sourceAccountId },
      });
      for (const f of fiches) {
        await this.prisma.service.create({
          data: {
            accountId: compte.id,
            title: f.title,
            description: f.description,
            category: f.category,
            categoryId: f.categoryId,
            duration: f.duration,
            durationMinutes: f.durationMinutes,
            maxParticipants: f.maxParticipants,
            publicTarget: f.publicTarget,
            publicTargets: f.publicTargets,
            material: f.material,
            prerequisites: f.prerequisites,
            objectives: f.objectives,
            methodology: f.methodology,
            evaluation: f.evaluation,
            faq: f.faq ?? undefined,
            images: f.images,
            priceExtras: f.priceExtras ?? undefined,
            timeSlots: f.timeSlots,
            price: f.price,
            creditCost: f.creditCost,
            city: f.city,
            // Toujours en brouillon : c'est lui qui décide de publier.
            status: 'DRAFT',
          },
        });
        importees += 1;
      }
    }

    return { account: compte, importees, dejaExistant: Boolean(existant) };
  }

  /** Fiches du compte source que l'utilisateur peut reprendre à son compte. */
  async fichesImportables(userId: string, sourceAccountId: string) {
    await this.requireMembership(userId, sourceAccountId);
    return this.prisma.service.findMany({
      where: { accountId: sourceAccountId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, category: true, price: true, status: true },
      take: 60,
    });
  }

  async update(userId: string, accountId: string, dto: UpdateAccountDto) {
    await this.requireMembership(userId, accountId, [
      AccountRole.OWNER,
      AccountRole.ADMIN,
    ]);

    return this.prisma.account.update({
      where: { id: accountId },
      data: { ...dto } as Prisma.AccountUpdateInput,
    });
  }

  /** Suppression : réservée au OWNER (propriétaire du tenant). */
  async remove(userId: string, accountId: string) {
    const membership = await this.requireMembership(userId, accountId, [
      AccountRole.OWNER,
    ]);

    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });
    if (!account) throw new NotFoundException('Compte introuvable.');
    if (account.ownerId !== userId) {
      throw new ForbiddenException('Seul le propriétaire peut supprimer ce compte.');
    }

    await this.prisma.account.delete({ where: { id: accountId } });
    return { deleted: true, id: accountId, membershipId: membership.id };
  }

  /**
   * "Switch" de compte actif : valide l'appartenance et renvoie le contexte
   * de compte. Le front pose ensuite le header x-account-id / cookie.
   */
  async switchAccount(userId: string, accountId: string) {
    const membership = await this.requireMembership(userId, accountId);
    const account = await this.prisma.account.findUniqueOrThrow({
      where: { id: accountId },
      select: { id: true, name: true, slug: true, type: true, logoUrl: true },
    });
    return { account, role: membership.role, membershipId: membership.id };
  }

  /**
   * Ajuste les crédits d'un compte ESTABLISHMENT (packs de renfort).
   * OWNER/ADMIN uniquement. Refuse un solde négatif.
   */
  /**
   * Ajuste les crédits d'un compte établissement.
   * Réservé à l'administration plateforme (contrôlé par AdminGuard côté route) :
   * un établissement ne peut PAS s'auto-créditer sans contrepartie (paiement).
   * Le paramètre `platformAdmin` court-circuite le contrôle d'appartenance.
   */
  async adjustCredits(
    userId: string,
    accountId: string,
    delta: number,
    platformAdmin = false,
  ) {
    if (!platformAdmin) {
      await this.requireMembership(userId, accountId, [
        AccountRole.OWNER,
        AccountRole.ADMIN,
      ]);
    }

    const account = await this.prisma.account.findUniqueOrThrow({
      where: { id: accountId },
      select: { type: true, credits: true },
    });

    if (account.type !== AccountType.ESTABLISHMENT) {
      throw new BadRequestException(
        'Les crédits ne concernent que les comptes ESTABLISHMENT.',
      );
    }

    const next = account.credits + delta;
    if (next < 0) {
      throw new BadRequestException('Crédits insuffisants.');
    }

    // Variation + entrée de grand livre dans la même transaction (traçabilité).
    const [updated] = await this.prisma.$transaction([
      this.prisma.account.update({
        where: { id: accountId },
        data: { credits: next },
        select: { id: true, credits: true },
      }),
      this.prisma.creditLedger.create({
        data: {
          accountId,
          delta,
          balanceAfter: next,
          reason: 'ADMIN_TOPUP',
        },
      }),
    ]);

    return updated;
  }

  /**
   * Débit interne de crédits (réservation d'atelier par un établissement, etc.).
   * Vérifie le solde, décrémente Account.credits et écrit le grand livre dans la
   * MÊME transaction. Lève 400 « Crédits insuffisants » si le solde ne couvre pas.
   * Ne fait AUCUN contrôle d'appartenance : à appeler par une logique déjà gardée.
   */
  async debitCredits(
    accountId: string,
    amount: number,
    reason: string,
    refs?: { bookingId?: string; invoiceId?: string },
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Le montant à débiter doit être positif.');
    }
    return this.prisma.$transaction(async (tx) => {
      const account = await tx.account.findUniqueOrThrow({
        where: { id: accountId },
        select: { credits: true },
      });
      if (account.credits < amount) {
        throw new BadRequestException('Crédits insuffisants');
      }
      const balanceAfter = account.credits - amount;
      const updated = await tx.account.update({
        where: { id: accountId },
        data: { credits: balanceAfter },
        select: { id: true, credits: true },
      });
      await tx.creditLedger.create({
        data: {
          accountId,
          delta: -amount,
          balanceAfter,
          reason,
          bookingId: refs?.bookingId,
          invoiceId: refs?.invoiceId,
        },
      });
      return updated;
    });
  }

  /**
   * Solde de crédits + historique récent (grand livre) d'un compte.
   * Réservé aux membres actifs du compte (isolation multi-tenant).
   */
  async creditLedger(userId: string, accountId: string, limit = 10) {
    await this.requireMembership(userId, accountId);
    const [account, entries] = await this.prisma.$transaction([
      this.prisma.account.findUniqueOrThrow({
        where: { id: accountId },
        select: { credits: true },
      }),
      this.prisma.creditLedger.findMany({
        where: { accountId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);
    return { balance: account.credits, entries };
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = slugify(name) || 'compte';
    let candidate = base;
    for (let i = 0; i < 5; i++) {
      const clash = await this.prisma.account.findUnique({ where: { slug: candidate } });
      if (!clash) return candidate;
      candidate = `${base}-${randomSuffix(4)}`;
    }
    return `${base}-${randomSuffix(8)}`;
  }
}
