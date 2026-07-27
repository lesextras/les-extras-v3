import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
    constructor(private prisma: PrismaService) { }

    async create(createNotificationDto: CreateNotificationDto) {
        return this.prisma.notification.create({
            data: {
                userId: createNotificationDto.userId,
                message: createNotificationDto.message,
                type: createNotificationDto.type,
            },
        });
    }

    async findAll(userId: string) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async markAsRead(id: string, userId: string) {
        const notification = await this.prisma.notification.findUnique({
            where: { id },
            select: { id: true, userId: true },
        });

        if (!notification) {
            throw new NotFoundException("Notification introuvable");
        }

        if (notification.userId !== userId) {
            throw new ForbiddenException("Accès refusé à cette notification");
        }

        return this.prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });
    }
}
