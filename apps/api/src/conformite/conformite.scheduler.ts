import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AccountType, ComplianceStatus, ServiceStatus, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ConformiteService } from './conformite.service';

/**
 * LA RELANCE DU DOSSIER — ce qui fait qu'un intervenant visible devient
 * réservable.
 *
 * Un chef de service qui ouvre une fiche et ne trouve pas « pièces
 * contrôlées » passe à la suivante. La fiche existe, l'intervenant est
 * disponible, et rien ne se passe : c'est le dossier qui manque, et personne
 * ne le lui a dit depuis son inscription.
 *
 * Un passage par semaine, le lundi, pour les seuls intervenants qui ont une
 * fiche publiée — ceux que le marché regarde. Une même personne n'est pas
 * relancée plus d'une fois toutes les deux semaines : la cloche et le courriel
 * doivent rester un rappel, pas une nuisance.
 *
 * ⚠ RIEN N'EST VÉRIFIÉ ICI. Le contrôle des pièces reste un geste humain,
 * côté structure ou côté ADéPA. Ce passage ne fait que compter ce qui manque
 * et le dire à la personne concernée.
 */
@Injectable()
export class ConformiteScheduler {
  private readonly logger = new Logger(ConformiteScheduler.name);

  /** Borne la durée d'un passage. */
  private static readonly LOT = 200;
  /** Deux semaines entre deux rappels à la même personne. */
  private static readonly JOURS_ENTRE_RAPPELS = 13;
  static readonly TYPE = 'DOSSIER_RAPPEL';

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Le lundi à 9 h 45, heure de Paris — entre la fraîcheur du vivier (9 h 30)
   * et le tunnel d'accueil (10 h 15), pour ne jamais partager une minute
   * d'envoi avec un autre passage.
   */
  @Cron(process.env.CONFORMITE_CRON ?? '45 9 * * 1', {
    name: 'conformite-rappel-dossier',
    timeZone: 'Europe/Paris',
  })
  async passer() {
    const requis = ConformiteService.REQUIRED_TYPES;
    const comptes = await this.prisma.account.findMany({
      where: {
        type: AccountType.FREELANCE,
        services: { some: { status: ServiceStatus.PUBLISHED } },
        owner: {
          emailVerified: true,
          status: { notIn: [UserStatus.BANNED, UserStatus.ANONYMIZED] },
        },
      },
      take: ConformiteScheduler.LOT,
      select: { id: true, ownerId: true },
    });

    const limite = new Date(
      Date.now() - ConformiteScheduler.JOURS_ENTRE_RAPPELS * 24 * 3600 * 1000,
    );
    let envoyes = 0;

    for (const compte of comptes) {
      if (!compte.ownerId) continue;
      const valides = await this.prisma.complianceDocument.findMany({
        where: {
          userId: compte.ownerId,
          status: ComplianceStatus.VALID,
          type: { in: requis },
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        select: { type: true },
      });
      const nbValides = new Set(valides.map((d) => d.type)).size;
      if (nbValides >= requis.length) continue;

      // Le verrou : la dernière cloche de ce type fait foi, pas de nouveau
      // champ en base pour ça.
      const recent = await this.prisma.notification.findFirst({
        where: {
          userId: compte.ownerId,
          type: ConformiteScheduler.TYPE,
          createdAt: { gte: limite },
        },
        select: { id: true },
      });
      if (recent) continue;

      const manquantes = requis.length - nbValides;
      await this.notifications.create(compte.ownerId, {
        type: ConformiteScheduler.TYPE,
        title: `Votre dossier : ${nbValides}/${requis.length} pièces vérifiées`,
        body:
          manquantes === 1
            ? 'Il manque une pièce obligatoire. Un établissement ne confie pas d’intervention sans dossier complet : déposez-la, la structure la vérifie, et votre fiche l’affichera.'
            : `Il manque ${manquantes} pièces obligatoires. Un établissement ne confie pas d’intervention sans dossier complet : déposez-les, la structure les vérifie, et votre fiche l’affichera.`,
        link: '/dashboard/mon-dossier',
      });
      envoyes += 1;
    }

    if (envoyes > 0) {
      this.logger.log(`Rappel de dossier envoyé à ${envoyes} intervenant(s).`);
    }
  }
}
