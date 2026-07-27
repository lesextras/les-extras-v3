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

    // Vérification email : token JWT signé (stub, envoi loggé).
    const verifyToken = await this.signEmailVerifyToken(user.id, email);
    await this.mail.sendEmailVerification(email, verifyToken);

    const accessToken = await this.signAccessToken(user.id, email, user.role);
    return {
      accessToken,
      user: await this.buildMe(user.id),
      // Exposé en dev pour tester la vérif sans SMTP réel.
      emailVerificationToken: verifyToken,
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

    await this.prisma.user.update({
      where: { id: payload.sub },
      data: { emailVerified: true, status: UserStatus.VERIFIED },
    });

    return { verified: true };
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
              select: { id: true, name: true, slug: true, type: true, logoUrl: true },
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
            account: { select: { id: true, name: true, type: true } },
          },
        },
      },
    });
    const accounts = (full?.memberships ?? []).map((m) => ({
      id: m.account.id,
      name: m.account.name,
      type: m.account.type,
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
