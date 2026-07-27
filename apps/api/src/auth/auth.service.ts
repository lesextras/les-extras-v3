import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { randomBytes, createHash } from "crypto";
import { JwtService } from "@nestjs/jwt";
import { UserRole, UserStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { JwtPayload } from "./types/jwt-payload.type";
import { MailService } from "../mail/mail.service";

type AuthResponse = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
    onboardingStep: number;
  };
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) { }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException("Email already in use");
    }

    const password = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password,
        role: dto.role,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    const nameForEmail = dto.email.split('@')[0];
    if (dto.role === UserRole.FREELANCE) {
      this.mailService.sendWelcomeFreelanceEmail(user.email, nameForEmail!).catch(e => console.error(e));
    } else if (dto.role === UserRole.ESTABLISHMENT) {
      this.mailService.sendWelcomeEstablishmentEmail(user.email, nameForEmail!).catch(e => console.error(e));
    }

    return {
      accessToken: await this.signToken(user.id, user.email, user.role, 0),
      user: {
        ...user,
        onboardingStep: 0,
      },
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        password: true,
        onboardingStep: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (user.status === UserStatus.BANNED) {
      throw new ForbiddenException("Account is banned");
    }

    return {
      accessToken: await this.signToken(user.id, user.email, user.role, user.onboardingStep),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        onboardingStep: user.onboardingStep,
      },
    };
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });
    if (!user) return; // never reveal whether email exists

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken: tokenHash, resetTokenExpiry: expiry },
    });

    const frontendUrl = process.env.FRONTEND_URL ?? "https://les-extras.com";
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${rawToken}`;
    this.mailService
      .sendPasswordResetEmail(user.email, resetUrl)
      .catch((e) => console.error("Password reset email failed:", e));
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: tokenHash,
        resetTokenExpiry: { gt: new Date() },
      },
      select: { id: true },
    });

    if (!user) {
      throw new BadRequestException("Token invalide ou expiré");
    }

    const password = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password, resetToken: null, resetTokenExpiry: null },
    });
  }

  private async signToken(
    id: string,
    email: string,
    role: UserRole,
    onboardingStep: number,
  ): Promise<string> {
    const payload: JwtPayload = {
      sub: id,
      email,
      role,
      onboardingStep,
    };
    return this.jwtService.signAsync(payload);
  }
}
