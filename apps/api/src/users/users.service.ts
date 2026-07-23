import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

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
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
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
}
