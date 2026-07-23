import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { QueryUsersDto } from './dto/query-users.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { ModerateMissionDto, ModerateServiceDto } from './dto/moderate.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // --- Utilisateurs -------------------------------------------------------

  async listUsers(query: QueryUsersDto) {
    const where: Prisma.UserWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.role) where.role = query.role;
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
  }

  async banUser(id: string, dto: BanUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.BANNED },
      select: { id: true, email: true, status: true },
    });
    await this.notifications.create(id, {
      type: 'ACCOUNT_BANNED',
      title: 'Compte suspendu',
      body: dto.reason ?? 'Votre compte a été suspendu par un administrateur.',
    });
    return updated;
  }

  async unbanUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    return this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.VERIFIED },
      select: { id: true, email: true, status: true },
    });
  }

  // --- Modération missions ------------------------------------------------

  async listMissions() {
    return this.prisma.reliefMission.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { account: { select: { id: true, name: true } } },
    });
  }

  async moderateMission(id: string, dto: ModerateMissionDto) {
    const mission = await this.prisma.reliefMission.findUnique({ where: { id } });
    if (!mission) throw new NotFoundException('Mission introuvable.');
    return this.prisma.reliefMission.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  // --- Modération services ------------------------------------------------

  async listServices() {
    return this.prisma.service.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { account: { select: { id: true, name: true } } },
    });
  }

  async moderateService(id: string, dto: ModerateServiceDto) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) throw new NotFoundException('Service introuvable.');
    return this.prisma.service.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  // --- Stats rapides ------------------------------------------------------

  async stats() {
    const [users, accounts, missions, services, bookings] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.account.count(),
      this.prisma.reliefMission.count(),
      this.prisma.service.count(),
      this.prisma.booking.count(),
    ]);
    return { users, accounts, missions, services, bookings };
  }
}
