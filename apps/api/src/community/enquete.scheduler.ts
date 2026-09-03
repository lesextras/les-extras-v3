import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ServiceStatus, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../common/mail/mail.service';

/**
 * L'ENQUÊTE DE SATISFACTION — une fois, sept jours après la première fiche.
 *
 * Demandée par Siham le 3/09/2026 : « un questionnaire envoyé à tous ceux ayant
 * envoyé un 1er atelier pour mesurer la satisfaction et avoir un avis sur le
 * site et la procédure pour proposer ses services ».
 *
 * ── Les cinq règles tenues ici, reprises du tunnel d'accueil ────────────────
 *
 *  1. **UNE fois par compte, jamais deux.** `Account.enqueteAtelierAt` est le
 *     verrou, et il est posé AVANT l'envoi. Un doublon dans une boîte de
 *     réception coûte plus cher qu'une enquête manquante — surtout celle-ci,
 *     qui demande un service.
 *  2. **Sept jours après la PREMIÈRE fiche publiée**, pas après la dernière.
 *     C'est l'expérience du premier dépôt qu'on veut mesurer : celle où on
 *     découvre le formulaire, pas celle où on le connaît par cœur.
 *  3. **Adresse non confirmée → rien.** Même raison que partout ailleurs :
 *     écrire à une adresse dont on n'a pas la preuve qu'elle existe abîme la
 *     délivrabilité des messages qui comptent, contrats et factures compris.
 *  4. **Plancher de 60 jours.** Au premier passage, les comptes qui ont publié
 *     il y a des mois ne reçoivent pas une enquête sur « votre première mise en
 *     ligne » — c'est le genre de message qui apprend au lecteur qu'on ne le
 *     regarde pas. Plus large que les 30 jours du tunnel : une expérience de
 *     dépôt se raconte encore deux mois après, une inscription non.
 *  5. **`hebdoOptIn` NE s'applique PAS ici, et c'est délibéré.** Cette case
 *     couvre ce qui est éditorial — le rendez-vous du lundi, la séquence
 *     d'accueil. Une enquête sur un service qu'on vient d'utiliser relève de la
 *     relation de service, comme un accusé de réception. Elle part une seule
 *     fois et ne propose rien à vendre. En revanche, un compte BANNED ou
 *     ANONYMIZED n'en reçoit jamais.
 *
 * ⚠ ON MESURE `createdAt` DE LA FICHE, PAS SA DATE DE PUBLICATION : `Service`
 * ne porte pas de `publishedAt`. Pour l'écrasante majorité des fiches, les deux
 * sont à quelques minutes l'une de l'autre (le formulaire crée puis publie dans
 * la foulée). L'écart n'existe que pour une fiche restée longtemps en brouillon,
 * et il joue dans le bon sens : l'enquête part un peu plus tôt, jamais plus
 * tard. Ajouter une colonne pour ce cas coûterait plus qu'il ne rapporte.
 */
@Injectable()
export class EnqueteScheduler {
  private readonly logger = new Logger(EnqueteScheduler.name);

  /** Délai entre la première mise en ligne et l'enquête. */
  private static readonly DELAI_JOURS = 7;
  /** Au-delà, on ne réveille pas un souvenir que la personne n'a plus. */
  private static readonly PLANCHER_JOURS = 60;
  /** Une enquête n'est jamais urgente : on n'inonde pas la boîte d'envoi. */
  private static readonly LOT = 50;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  /**
   * Tous les jours à 10 h 45, heure de Paris — une demi-heure après le tunnel
   * d'accueil, pour que les deux ne partent jamais dans la même minute chez
   * quelqu'un qui recevrait les deux.
   */
  @Cron(process.env.ENQUETE_CRON ?? '45 10 * * *', {
    name: 'enquete-premier-atelier',
    timeZone: 'Europe/Paris',
  })
  async envoyer() {
    const jour = 86_400_000;
    const maintenant = Date.now();
    const delai = new Date(maintenant - EnqueteScheduler.DELAI_JOURS * jour);
    const plancher = new Date(maintenant - EnqueteScheduler.PLANCHER_JOURS * jour);

    const comptes = await this.prisma.account.findMany({
      where: {
        enqueteAtelierAt: null,
        owner: {
          emailVerified: true,
          status: { notIn: [UserStatus.BANNED, UserStatus.ANONYMIZED] },
        },
        services: {
          some: {
            status: ServiceStatus.PUBLISHED,
            createdAt: { lte: delai, gte: plancher },
          },
        },
      },
      select: {
        id: true,
        owner: { select: { email: true, firstName: true } },
        services: {
          where: { status: ServiceStatus.PUBLISHED },
          orderBy: { createdAt: 'asc' },
          take: 1,
          select: { title: true },
        },
      },
      take: EnqueteScheduler.LOT,
    });

    let envoyees = 0;
    for (const compte of comptes) {
      const email = compte.owner?.email;
      if (!email) continue;

      // Le verrou AVANT l'envoi. Voir la règle 1 en tête de fichier.
      await this.prisma.account.update({
        where: { id: compte.id },
        data: { enqueteAtelierAt: new Date() },
      });

      await this.mail
        .sendEnqueteAtelier(email, {
          prenom: compte.owner?.firstName,
          titreFiche: compte.services[0]?.title,
        })
        .catch((e) =>
          this.logger.warn(`Enquête non partie pour ${compte.id} : ${String(e)}`),
        );
      envoyees += 1;
    }

    if (envoyees > 0) this.logger.log(`Enquête « première mise en ligne » : ${envoyees} envoi(s).`);
    return { envoyees };
  }
}
