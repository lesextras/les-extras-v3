import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Connexion Prisma établie.');
    await this.reprendreAnciensArticles();
  }

  /**
   * Reprise de données, une seule fois. Avant l'ajout du champ `kind`, le rayon
   * de l'Édublog se déduisait de l'auteur : sans compte rattaché, c'était un
   * article de fond de l'équipe. On fige cette lecture pour l'existant, puis on
   * ne repasse plus (la présence d'au moins un ARTICLE suffit à le savoir).
   */
  private async reprendreAnciensArticles(): Promise<void> {
    try {
      const dejaFait = await this.article.count({ where: { kind: 'ARTICLE' } });
      if (dejaFait > 0) return;
      const { count } = await this.article.updateMany({
        where: { accountId: null },
        data: { kind: 'ARTICLE' },
      });
      if (count > 0) this.logger.log(`Édublog : ${count} article(s) de fond repris.`);
    } catch (e) {
      this.logger.warn(`Reprise des articles ignorée : ${(e as Error).message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
