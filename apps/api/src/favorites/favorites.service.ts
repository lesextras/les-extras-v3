import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Fiches mises de côté par un utilisateur.
 *
 * Le favori appartient à la personne, pas au compte : un directeur qui change
 * d'établissement garde sa sélection, et deux collègues du même établissement
 * ne se marchent pas dessus.
 */
@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Identifiants seuls : c'est tout ce dont l'interface a besoin pour cocher les cœurs. */
  async ids(userId: string): Promise<string[]> {
    const lignes = await this.prisma.favorite.findMany({
      where: { userId },
      select: { serviceId: true },
    });
    return lignes.map((l) => l.serviceId);
  }

  /** Fiches complètes, pour la page « Mes favoris ». */
  async list(userId: string) {
    const lignes = await this.prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        createdAt: true,
        service: {
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            city: true,
            images: true,
            category: true,
            status: true,
          },
        },
      },
    });
    // Une fiche dépubliée ne doit plus apparaître comme réservable.
    return lignes
      .filter((l) => l.service && l.service.status === 'PUBLISHED')
      .map((l) => ({ ...l.service, favoriteDepuis: l.createdAt }));
  }

  async add(userId: string, serviceId: string) {
    const fiche = await this.prisma.service.findFirst({
      where: { id: serviceId, status: 'PUBLISHED' },
      select: { id: true },
    });
    if (!fiche) throw new NotFoundException('Atelier introuvable.');
    // Idempotent : un double clic ne doit pas produire d'erreur.
    await this.prisma.favorite.upsert({
      where: { userId_serviceId: { userId, serviceId } },
      create: { userId, serviceId },
      update: {},
    });
    return { ok: true, serviceId, favori: true };
  }

  async remove(userId: string, serviceId: string) {
    await this.prisma.favorite
      .delete({ where: { userId_serviceId: { userId, serviceId } } })
      .catch(() => undefined);
    return { ok: true, serviceId, favori: false };
  }
}
