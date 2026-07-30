import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  AccountRole,
  AccountType,
  MembershipStatus,
  UserStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../common/mail/mail.service';
import { slugify, randomSuffix } from '../common/utils/slug.util';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const BCRYPT_ROUNDS = 12;
const EMAIL_VERIFY_PURPOSE = 'email-verify';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Un compte existe déjà avec cet email.');
    }

    if (dto.accountType === AccountType.ESTABLISHMENT && !dto.organizationName?.trim()) {
      throw new BadRequestException(
        'Le nom de la structure est requis pour un compte ESTABLISHMENT.',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // Nom du compte : structure pour ESTABLISHMENT, nom du praticien sinon.
    const accountName =
      dto.accountType === AccountType.ESTABLISHMENT
        ? (dto.organizationName as string).trim()
        : `${dto.firstName} ${dto.lastName}`.trim();

    const slug = await this.generateUniqueSlug(accountName);

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          password: passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          status: UserStatus.PENDING,
          emailVerified: false,
          onboardingStep: 0,
          // Profil systématique (données étendues, surtout FREELANCE).
          profile: { create: {} },
        },
      });

      const account = await tx.account.create({
        data: {
          name: accountName,
          type: dto.accountType,
          slug,
          legalName:
            dto.accountType === AccountType.ESTABLISHMENT ? accountName : undefined,
          ownerId: createdUser.id,
          // Attribution figée à la création. On ne la met jamais à jour
          // ensuite : un compte n'a qu'une seule origine, celle du jour où
          // la personne est arrivée.
          source: dto.source ?? 'direct',
          sourceMedium: dto.sourceMedium ?? null,
          sourceCampaign: dto.sourceCampaign ?? null,
          sourceLanding: dto.sourceLanding ?? null,
          // Parrainage : uniquement pour un nouveau compte intervenant, et
          // seulement si le parrain existe vraiment (sinon on ignore sans bruit).
          parrainAccountId:
            dto.accountType === AccountType.FREELANCE && dto.parrain
              ? (
                  await tx.account.findFirst({
                    where: { id: dto.parrain, type: AccountType.FREELANCE },
                    select: { id: true },
                  })
                )?.id ?? null
              : null,
        },
      });

      // Le créateur est toujours OWNER de son compte initial.
      await tx.membership.create({
        data: {
          userId: createdUser.id,
          accountId: account.id,
          role: AccountRole.OWNER,
          status: MembershipStatus.ACTIVE,
        },
      });

      return createdUser;
    });

    const verifyToken = await this.signEmailVerifyToken(user.id, email);
    await this.mail.sendEmailVerification(email, verifyToken, user.firstName);

    const accessToken = await this.signAccessToken(user.id, email, user.role);
    return {
      accessToken,
      user: await this.buildMe(user.id),
      // Le jeton n'est exposé qu'en développement, pour tester sans SMTP.
      // En production il ne doit JAMAIS transiter par la réponse HTTP.
      ...(this.config.get<string>('NODE_ENV') === 'production'
        ? {}
        : { emailVerificationToken: verifyToken }),
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Message générique : ne pas révéler si l'email existe.
    if (!user) {
      throw new UnauthorizedException('Identifiants invalides.');
    }

    if (user.status === UserStatus.BANNED) {
      throw new UnauthorizedException('Compte suspendu.');
    }
    if (user.status === UserStatus.ANONYMIZED) {
      throw new UnauthorizedException('Ce compte a été supprimé à la demande de son titulaire.');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Identifiants invalides.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = await this.signAccessToken(user.id, user.email, user.role);
    return { accessToken, user: await this.buildMe(user.id) };
  }

  async verifyEmail(token: string) {
    let payload: { sub: string; purpose: string };
    try {
      payload = await this.jwt.verifyAsync(token, {
        secret: this.config.get<string>('JWT_SECRET'),
      });
    } catch {
      throw new BadRequestException('Token de vérification invalide ou expiré.');
    }

    if (payload.purpose !== EMAIL_VERIFY_PURPOSE) {
      throw new BadRequestException('Token de vérification invalide.');
    }

    const avant = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        emailVerified: true,
        email: true,
        firstName: true,
        memberships: {
          where: { status: MembershipStatus.ACTIVE },
          select: { account: { select: { type: true } } },
          take: 1,
        },
      },
    });
    if (!avant) throw new BadRequestException('Compte introuvable.');

    // Le lien peut être cliqué plusieurs fois (prévisualisation du client mail,
    // renvoi…) : on ne renvoie l'e-mail de bienvenue qu'à la PREMIÈRE fois.
    const dejaVerifie = avant.emailVerified;

    await this.prisma.user.update({
      where: { id: payload.sub },
      data: { emailVerified: true, status: UserStatus.VERIFIED },
    });

    if (!dejaVerifie) {
      await this.mail
        .sendBienvenue(avant.email, {
          prenom: avant.firstName,
          type: avant.memberships[0]?.account.type ?? 'FREELANCE',
        })
        .catch(() => undefined);
    }

    return { verified: true, dejaVerifie };
  }

  /**
   * Renvoi du lien de confirmation.
   *
   * Réponse toujours identique, même si l'adresse est inconnue ou déjà
   * vérifiée : sinon l'endpoint devient un moyen de savoir qui est inscrit.
   */
  async resendVerification(email: string) {
    const propre = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: propre },
      select: { id: true, email: true, firstName: true, emailVerified: true },
    });

    if (user && !user.emailVerified) {
      const token = await this.signEmailVerifyToken(user.id, user.email);
      await this.mail
        .sendEmailVerification(user.email, token, user.firstName)
        .catch(() => undefined);
    }

    return {
      ok: true,
      message:
        'Si cette adresse correspond à un compte non confirmé, un nouveau lien vient d’être envoyé.',
    };
  }

  async me(userId: string) {
    return this.buildMe(userId);
  }

  /** Vue "me" : identité + profil + comptes accessibles (memberships actifs). */
  private async buildMe(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
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
        profile: true,
        memberships: {
          where: { status: MembershipStatus.ACTIVE },
          select: {
            id: true,
            role: true,
            status: true,
            account: {
              select: { id: true, name: true, slug: true, type: true, logoUrl: true, isMember: true },
            },
          },
        },
      },
    });
    return user;
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = slugify(name) || 'compte';
    let candidate = base;
    // Boucle bornée pour éviter les collisions de slug (unique en base).
    for (let i = 0; i < 5; i++) {
      const clash = await this.prisma.account.findUnique({ where: { slug: candidate } });
      if (!clash) return candidate;
      candidate = `${base}-${randomSuffix(4)}`;
    }
    return `${base}-${randomSuffix(8)}`;
  }

  private async signAccessToken(userId: string, email: string, role: string): Promise<string> {
    // Enrichit le JWT avec onboardingStep + comptes accessibles, pour que le
    // front (qui lit tout depuis le token) dispose du contexte multi-comptes.
    const full = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        onboardingStep: true,
        memberships: {
          where: { status: MembershipStatus.ACTIVE },
          select: {
            role: true,
            account: { select: { id: true, name: true, type: true, isMember: true } },
          },
        },
      },
    });
    const accounts = (full?.memberships ?? []).map((m) => ({
      id: m.account.id,
      name: m.account.name,
      type: m.account.type,
      isMember: m.account.isMember,
      role: m.role,
    }));
    const payload: Record<string, unknown> = {
      sub: userId,
      email,
      role,
      onboardingStep: full?.onboardingStep ?? 0,
      accounts,
      account: accounts[0] ?? null,
    };
    return this.jwt.signAsync(payload);
  }

  private signEmailVerifyToken(userId: string, email: string): Promise<string> {
    return this.jwt.signAsync(
      { sub: userId, email, purpose: EMAIL_VERIFY_PURPOSE },
      { expiresIn: '2d' as unknown as number },
    );
  }
}
