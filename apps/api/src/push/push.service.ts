import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClesVapid, envoyerPush, genererClesVapid } from './web-push';

/** Au-delà de ce nombre d'échecs d'affilée, l'abonnement est considéré mort. */
const ECHECS_AVANT_SUPPRESSION = 5;

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private cles: ClesVapid | null = null;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Les clés VAPID sont générées au premier démarrage et rangées en base.
   * Volontairement pas en variable d'environnement : personne n'a de manipulation
   * à faire pour que les notifications marchent, et les clés survivent aux
   * redéploiements.
   */
  async onModuleInit(): Promise<void> {
    try {
      this.cles = await this.chargerOuCreerCles();
    } catch (e) {
      // Une base pas encore migrée ne doit pas empêcher l'API de démarrer.
      this.logger.warn(`Clés push indisponibles au démarrage : ${(e as Error).message}`);
    }
  }

  private async chargerOuCreerCles(): Promise<ClesVapid> {
    const existantes = await this.prisma.reglage.findMany({
      where: { cle: { in: ['vapid_publique', 'vapid_privee'] } },
    });
    const pub = existantes.find((r) => r.cle === 'vapid_publique')?.valeur;
    const priv = existantes.find((r) => r.cle === 'vapid_privee')?.valeur;
    if (pub && priv) return { publique: pub, privee: priv };

    const nouvelles = genererClesVapid();
    await this.prisma.$transaction([
      this.prisma.reglage.upsert({
        where: { cle: 'vapid_publique' },
        create: { cle: 'vapid_publique', valeur: nouvelles.publique },
        update: { valeur: nouvelles.publique },
      }),
      this.prisma.reglage.upsert({
        where: { cle: 'vapid_privee' },
        create: { cle: 'vapid_privee', valeur: nouvelles.privee },
        update: { valeur: nouvelles.privee },
      }),
    ]);
    this.logger.log('Clés de notification push générées.');
    return nouvelles;
  }

  /** Clé publique à transmettre au navigateur pour qu'il crée son abonnement. */
  async clePublique(): Promise<string | null> {
    if (!this.cles) {
      try {
        this.cles = await this.chargerOuCreerCles();
      } catch {
        return null;
      }
    }
    return this.cles.publique;
  }

  /** Enregistre (ou rafraîchit) l'abonnement d'un appareil. */
  async abonner(
    userId: string,
    donnees: { endpoint: string; p256dh: string; auth: string; appareil?: string },
  ) {
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: donnees.endpoint },
      create: {
        userId,
        endpoint: donnees.endpoint,
        p256dh: donnees.p256dh,
        auth: donnees.auth,
        appareil: donnees.appareil,
      },
      // Un même appareil peut changer de main : on réattribue et on repart de zéro.
      update: {
        userId,
        p256dh: donnees.p256dh,
        auth: donnees.auth,
        appareil: donnees.appareil,
        echecs: 0,
      },
    });
    return { ok: true };
  }

  async desabonner(userId: string, endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
    return { ok: true };
  }

  /** Les appareils actuellement abonnés pour cette personne. */
  async mesAppareils(userId: string) {
    return this.prisma.pushSubscription.findMany({
      where: { userId },
      select: { id: true, appareil: true, dernierOk: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Envoie une notification à tous les appareils d'une personne.
   * Ne lève jamais : une notification qui échoue ne doit pas faire échouer
   * l'action métier qui l'a déclenchée (accepter une mission, par exemple).
   */
  async notifier(
    userId: string,
    contenu: { titre: string; corps?: string; lien?: string; tag?: string },
  ): Promise<void> {
    try {
      const cles = this.cles ?? (await this.chargerOuCreerCles());
      const abonnements = await this.prisma.pushSubscription.findMany({ where: { userId } });
      if (abonnements.length === 0) return;

      const message = JSON.stringify({
        titre: contenu.titre,
        corps: contenu.corps ?? '',
        lien: contenu.lien ?? '/dashboard',
        tag: contenu.tag ?? 'lesextras',
      });
      const contact = 'mailto:contact@adepa77.fr';

      await Promise.all(
        abonnements.map(async (abo) => {
          const resultat = await envoyerPush(abo, message, cles, contact);
          if (resultat.ok) {
            await this.prisma.pushSubscription
              .update({ where: { id: abo.id }, data: { dernierOk: new Date(), echecs: 0 } })
              .catch(() => undefined);
            return;
          }
          if (resultat.perime || abo.echecs + 1 >= ECHECS_AVANT_SUPPRESSION) {
            await this.prisma.pushSubscription
              .delete({ where: { id: abo.id } })
              .catch(() => undefined);
            return;
          }
          await this.prisma.pushSubscription
            .update({ where: { id: abo.id }, data: { echecs: { increment: 1 } } })
            .catch(() => undefined);
        }),
      );
    } catch (e) {
      this.logger.warn(`Envoi push ignoré : ${(e as Error).message}`);
    }
  }
}
