import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../common/mail/mail.service';
import { AlertesService } from './alertes.service';

/**
 * L'ENVOI DES ALERTES DE RECHERCHE.
 *
 * ⚠ UNE ALERTE QUI PART TROP SOUVENT SE DÉSABONNE. Le passage est quotidien
 * mais n'écrit QUE s'il y a du neuf : sur un catalogue qui grossit de quelques
 * fiches par mois, la plupart des jours ne produisent aucun courriel, et c'est
 * exactement ce qu'on veut. Un message qui arrive est un message qui apporte
 * quelque chose.
 *
 * ⚠ LE VERROU SE POSE AVANT L'ENVOI, comme pour le tunnel et l'enquête. Un
 * doublon coûte plus cher qu'un message manquant : le premier fait
 * désabonner, le second se rattrape le lendemain.
 *
 * ⚠ `hebdoOptIn` NE S'APPLIQUE PAS ICI, et c'est délibéré. Cette case couvre
 * l'éditorial, le rendez-vous du lundi. Une alerte est demandée explicitement,
 * critère par critère, par quelqu'un qui attend précisément ce message : la
 * couper au nom d'un réglage éditorial serait ne pas rendre le service promis.
 * Désactiver l'alerte, elle, se fait d'un clic sur sa page.
 */
@Injectable()
export class AlertesScheduler {
  private readonly logger = new Logger(AlertesScheduler.name);

  /** Nombre d'alertes traitées par passage. Borne la facture et la durée. */
  private static readonly LOT = 100;

  /** Fiches citées dans un courriel. Au-delà, on renvoie vers le catalogue. */
  private static readonly PAR_MESSAGE = 5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly alertes: AlertesService,
  ) {}

  /**
   * Tous les jours à 8 h 15, heure de Paris.
   *
   * Avant le tunnel d'accueil (10 h 15) et l'enquête (10 h 45) : une alerte est
   * une information de travail, elle a sa place au moment où l'on ouvre sa
   * boîte, pas au milieu de la matinée.
   */
  @Cron(process.env.ALERTES_CRON ?? '15 8 * * *', {
    name: 'alertes-recherche',
    timeZone: 'Europe/Paris',
  })
  async envoyer() {
    const alertes = await this.prisma.alerteRecherche.findMany({
      where: {
        actif: true,
        user: {
          emailVerified: true,
          status: { notIn: [UserStatus.BANNED, UserStatus.ANONYMIZED] },
        },
      },
      orderBy: { dernierEnvoiAt: { sort: 'asc', nulls: 'first' } },
      take: AlertesScheduler.LOT,
      select: {
        id: true,
        userId: true,
        user: { select: { email: true, firstName: true } },
      },
    });

    let envoyees = 0;
    for (const a of alertes) {
      const email = a.user?.email;
      if (!email) continue;

      let nouveautes;
      try {
        nouveautes = await this.alertes.nouveautes(a.id, AlertesScheduler.PAR_MESSAGE);
      } catch (e) {
        this.logger.error(`[ALERTES] lecture ${a.id} : ${(e as Error).message}`);
        continue;
      }
      if (nouveautes.length === 0) continue;

      // Le verrou AVANT l'envoi : si le courriel échoue, on ne réessaie pas
      // demain avec les mêmes fiches, on repart des suivantes. Une alerte
      // manquée vaut mieux qu'une alerte envoyée deux fois.
      await this.prisma.alerteRecherche.update({
        where: { id: a.id },
        data: {
          dernierEnvoiAt: new Date(),
          signalees: { increment: nouveautes.length },
        },
      });

      await this.mail
        .sendAlerteRecherche(email, {
          prenom: a.user?.firstName ?? null,
          fiches: nouveautes.map((f) => ({
            titre: f.title,
            chemin: `/ateliers/${f.slug ?? f.id}`,
            lieu: f.city ?? null,
            prix: f.price == null ? null : Number(f.price),
          })),
        })
        .catch((e) => this.logger.error(`[ALERTES] envoi ${email} : ${(e as Error).message}`));

      envoyees += 1;
    }

    if (envoyees > 0) {
      this.logger.log(`[ALERTES] ${envoyees} alerte(s) envoyée(s) sur ${alertes.length} examinée(s)`);
    }
    return { examinees: alertes.length, envoyees };
  }
}
