import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../common/mail/mail.service';
import { DisponibilitesService } from './disponibilites.service';

/**
 * LA FRAÎCHEUR DU VIVIER — ce qui fait qu'un établissement y revient.
 *
 * ⚠ UNE DISPONIBILITÉ PÉRIMÉE COÛTE PLUS CHER QU'UNE LIGNE MANQUANTE. Un chef
 * de service qui écrit à quatre personnes et n'obtient aucune réponse parce
 * qu'elles ont toutes retrouvé un poste depuis des mois ne revient pas sur
 * l'écran. C'est ainsi que meurt un vivier : pas vide, mais faux.
 *
 * Deux passages, un seul par jour :
 *   — une relance, quelques jours avant la date de péremption ;
 *   — la mise en veille, passé le délai.
 *
 * ⚠ LA MISE EN VEILLE NE SUPPRIME RIEN. `enVeille` sort la ligne de la liste ;
 * le métier, le territoire et la présentation que la personne a pris le temps
 * d'écrire restent en place, et un clic la ramène. Supprimer l'obligerait à
 * tout ressaisir pour revenir trois semaines plus tard.
 *
 * ⚠ LE VERROU SE POSE AVANT L'ENVOI (`relanceeLe`), comme pour le tunnel,
 * l'enquête et les alertes. Un doublon dans une boîte coûte plus cher qu'un
 * message manquant.
 */
@Injectable()
export class DisponibilitesScheduler {
  private readonly logger = new Logger(DisponibilitesScheduler.name);

  /** Borne la facture et la durée d'un passage. */
  private static readonly LOT = 100;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  /**
   * Tous les jours à 9 h 30, heure de Paris.
   *
   * Entre les alertes de recherche (8 h 15) et le tunnel d'accueil (10 h 15) :
   * les envois de la plateforme ne doivent jamais tomber dans la même minute,
   * la réserve quotidienne de courriels est étroite.
   */
  @Cron(process.env.DISPONIBILITES_CRON ?? '30 9 * * *', {
    name: 'disponibilites-fraicheur',
    timeZone: 'Europe/Paris',
  })
  async passer() {
    await this.relancer();
    await this.mettreEnVeille();
  }

  /** « Toujours disponible ? » — une fois, et une seule. */
  private async relancer() {
    const limite = new Date(
      Date.now() - DisponibilitesService.JOURS_AVANT_RELANCE * 24 * 3600 * 1000,
    );
    const lignes = await this.prisma.disponibiliteRenfort.findMany({
      where: {
        actif: true,
        enVeille: false,
        relanceeLe: null,
        confirmeeLe: { lte: limite },
        account: {
          owner: {
            emailVerified: true,
            status: { notIn: [UserStatus.BANNED, UserStatus.ANONYMIZED] },
          },
        },
      },
      take: DisponibilitesScheduler.LOT,
      select: {
        id: true,
        account: { select: { owner: { select: { email: true, firstName: true } } } },
      },
    });

    for (const ligne of lignes) {
      // Le verrou d'abord : un échec d'envoi ne doit pas produire un doublon
      // au passage suivant.
      await this.prisma.disponibiliteRenfort.update({
        where: { id: ligne.id },
        data: { relanceeLe: new Date() },
      });
      await this.mail
        .sendRelanceDisponibilite(ligne.account.owner.email, {
          prenom: ligne.account.owner.firstName,
          jours:
            DisponibilitesService.JOURS_AVANT_VEILLE -
            DisponibilitesService.JOURS_AVANT_RELANCE,
        })
        .catch((e) => this.logger.warn(`Relance disponibilité non partie : ${e}`));
    }
    if (lignes.length) this.logger.log(`${lignes.length} relance(s) de disponibilité.`);
  }

  /** Passé le délai, la ligne sort de la liste — sans être supprimée. */
  private async mettreEnVeille() {
    const limite = new Date(
      Date.now() - DisponibilitesService.JOURS_AVANT_VEILLE * 24 * 3600 * 1000,
    );
    const { count } = await this.prisma.disponibiliteRenfort.updateMany({
      where: { actif: true, enVeille: false, confirmeeLe: { lte: limite } },
      data: { enVeille: true },
    });
    if (count) this.logger.log(`${count} disponibilité(s) mise(s) en veille.`);
  }
}
