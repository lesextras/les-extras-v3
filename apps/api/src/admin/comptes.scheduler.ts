import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { motifDeBlocage } from '../common/suppression-compte';

/**
 * L'ÉCHÉANCE DES COMPTES SUPPRIMÉS.
 *
 * « Supprimer » un compte l'archive et pose une date à trois mois (décision de
 * Siham, 16/09/2026). Ce passage quotidien exécute les échéances arrivées à
 * terme — c'est le seul endroit du dépôt où un compte est réellement détruit.
 *
 * ⚠⚠ IL NE FORCE JAMAIS. Un compte qui a émis une facture ou signé un CDD ne
 * peut pas être supprimé, et le délai n'y change rien : `Invoice` et
 * `ContratCDD` sont en `onDelete: Cascade`, détruire le compte détruirait les
 * documents. Une facture émise se conserve dix ans (art. L123-22 du code de
 * commerce) et sa numérotation doit rester continue (art. 242 nonies A, ann. II
 * du CGI). Le planificateur inscrit alors son refus en toutes lettres dans
 * `suppressionMotifBlocage`, que l'écran d'administration affiche.
 *
 * ⚠ IL NE REPOUSSE PAS L'ÉCHÉANCE quand il est bloqué, et c'est voulu. Une date
 * qui glisse toute seule donne l'illusion que quelque chose va finir par se
 * passer ; une date dépassée doublée d'un motif dit la vérité — ce compte ne
 * sera pas supprimé, et voici pourquoi.
 *
 * ⚠ IL N'ANONYMISE PAS. L'effacement des données personnelles d'une personne
 * est un autre geste, demandé par elle, et il existe déjà :
 * `UsersService.effacerMonCompte`. Le confondre avec le rangement d'un compte
 * d'organisation ferait disparaître des données que personne n'a demandé à voir
 * disparaître.
 */
@Injectable()
export class ComptesScheduler {
  private readonly logger = new Logger(ComptesScheduler.name);

  /**
   * Comptes traités par passage. Une suppression en cascade touche des dizaines
   * de tables : on en fait peu à la fois plutôt que de tenir une transaction
   * longue sur la base de production.
   */
  private static readonly LOT = 20;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tous les jours à 4 h 30, heure de Paris.
   *
   * Après la sauvegarde nocturne de la base (3 h UTC) : si un compte est
   * supprimé par erreur, la copie de la nuit le contient encore. C'est la seule
   * raison de cette heure-là, et il ne faut pas la remonter avant la sauvegarde.
   */
  @Cron(process.env.COMPTES_SUPPRESSION_CRON ?? '30 4 * * *', {
    name: 'suppression-comptes',
    timeZone: 'Europe/Paris',
  })
  async executerLesEcheances() {
    const echus = await this.prisma.account.findMany({
      where: {
        suppressionPrevueLe: { lte: new Date() },
        // Un compte déjà bloqué a été examiné : on ne le réexamine que si le
        // motif a été effacé (c'est-à-dire si l'échéance a été reprogrammée).
        suppressionMotifBlocage: null,
      },
      select: { id: true, name: true, suppressionPrevueLe: true },
      orderBy: { suppressionPrevueLe: 'asc' },
      take: ComptesScheduler.LOT,
    });

    if (echus.length === 0) return { examines: 0, supprimes: 0, bloques: 0 };

    let supprimes = 0;
    let bloques = 0;

    for (const compte of echus) {
      const [factures, facturesAPayer, contrats] = await Promise.all([
        this.prisma.invoice.count({ where: { accountId: compte.id } }),
        this.prisma.invoice.count({ where: { payerAccountId: compte.id } }),
        this.prisma.contratCDD.count({ where: { accountId: compte.id } }),
      ]);

      const motif = motifDeBlocage({ factures, facturesAPayer, contrats });
      if (motif) {
        await this.prisma.account.update({
          where: { id: compte.id },
          data: { suppressionMotifBlocage: motif },
        });
        bloques += 1;
        this.logger.warn(
          `Compte « ${compte.name} » (${compte.id}) non supprimé : ${motif}`,
        );
        continue;
      }

      /**
       * ⚠ LA SUPPRESSION EST JOURNALISÉE AVANT D'ÊTRE FAITE. Une fois la ligne
       * partie, plus rien ne dit qu'elle a existé : le journal du conteneur est
       * la seule trace qui reste, et il faut qu'elle soit écrite même si la
       * suppression échoue à mi-chemin.
       */
      this.logger.log(
        `Suppression définitive du compte « ${compte.name} » (${compte.id}), ` +
          `programmée le ${compte.suppressionPrevueLe?.toISOString().slice(0, 10)}.`,
      );
      try {
        await this.prisma.account.delete({ where: { id: compte.id } });
        supprimes += 1;
      } catch (e) {
        /**
         * ⚠ UN ÉCHEC NE DOIT PAS ARRÊTER LE LOT NI SE REPRÉSENTER CHAQUE NUIT.
         * Une contrainte qu'on n'avait pas prévue (une table ajoutée depuis,
         * sans cascade) ferait sinon une erreur par jour, indéfiniment, dans
         * des journaux que personne ne relit. On l'inscrit comme un blocage :
         * elle devient visible à l'écran, une fois.
         */
        const message = (e as Error).message.slice(0, 300);
        await this.prisma.account.update({
          where: { id: compte.id },
          data: {
            suppressionMotifBlocage: `Suppression impossible pour une raison technique : ${message}`,
          },
        });
        bloques += 1;
        this.logger.error(
          `Échec de la suppression du compte ${compte.id} : ${message}`,
        );
      }
    }

    this.logger.log(
      `Échéances de suppression : ${echus.length} examinée(s), ${supprimes} supprimée(s), ${bloques} bloquée(s).`,
    );
    return { examines: echus.length, supprimes, bloques };
  }
}
