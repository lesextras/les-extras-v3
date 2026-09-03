import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../common/mail/mail.service';

/**
 * LE TUNNEL D'ACCUEIL — six messages, un tous les trois jours.
 *
 * Demandé par Siham le 03/09/2026 : « faire rentrer les nouveaux inscrits dans
 * un tunnel d'envoi de mail », sur le modèle de la séquence d'iPhone
 * Photography School qu'elle reçoit.
 *
 * Ce qui existait déjà : le message de bienvenue (à l'inscription), la relance
 * d'activation du lendemain, et le rendez-vous du lundi. Ce qui manquait, et
 * qui est exactement ce que fait le modèle : une SÉQUENCE — plusieurs messages
 * espacés, chacun avec une seule idée utilisable, qui construisent l'habitude
 * d'ouvrir avant de demander quoi que ce soit.
 *
 * ── Les cinq règles tenues par ce planificateur ─────────────────────────────
 *
 *  1. **UN message par passage, jamais deux.** `tunnelDernierAt` interdit
 *     d'écrire deux fois dans le même intervalle, et `tunnelEtape` dit où on
 *     en est. Un planificateur qui passerait deux fois (redéploiement, reprise
 *     après panne) n'envoie rien de plus.
 *  2. **La séquence ne saute pas de message.** C'est un compteur, pas un
 *     calendrier : après une panne de deux jours, le compte reçoit le message
 *     qu'il attendait, pas celui du jour.
 *  3. **Adresse non confirmée → rien.** Écrire six fois à une adresse dont on
 *     n'a pas la preuve qu'elle existe abîme la délivrabilité de tous les
 *     autres messages, y compris les contrats et les factures.
 *  4. **`hebdoOptIn` fait foi.** C'est la case que la personne décoche dans son
 *     profil. Une seule case pour tout ce qui n'est pas transactionnel : deux
 *     interrupteurs pour la même promesse, c'est un interrupteur qu'on croit
 *     avoir actionné.
 *  5. **Plancher de 30 jours.** Au premier déploiement, les comptes anciens ne
 *     reçoivent pas une séquence d'accueil des mois après leur inscription —
 *     c'est le genre de message qui apprend au lecteur qu'on ne le regarde pas.
 *
 * ⚠ Ce que ce tunnel NE FAIT PAS, et c'est délibéré : aucun compte à rebours,
 * aucune remise, aucune échéance. Le modèle en est plein ; l'association n'a
 * rien à vendre à ce stade (l'attestation à 20 € attend le médiateur de la
 * consommation, les CGV et le droit de rétractation), et une échéance annoncée
 * qui n'en est pas une est une pratique commerciale trompeuse. Voir le
 * commentaire de `sendTunnelAccueil` dans `mail.service.ts`.
 */
@Injectable()
export class TunnelScheduler {
  private readonly logger = new Logger(TunnelScheduler.name);

  /** Nombre de messages de la séquence (voir `TUNNEL_ACCUEIL`). */
  private static readonly ETAPES = 6;
  /** Jours entre deux messages. Trois, pas deux — voir `mail.service.ts`. */
  private static readonly INTERVALLE_JOURS = 3;
  /** Le premier message part trois jours après l'inscription. */
  private static readonly DELAI_PREMIER_JOURS = 3;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  /**
   * Tous les jours à 10 h 15, heure de Paris.
   *
   * L'heure est reprise du modèle, et ce n'est pas de la superstition : leur
   * séquence part à la même minute depuis des mois. Une heure fixe se
   * reconnaît, et elle évite de tomber au milieu d'une transmission.
   */
  @Cron(process.env.TUNNEL_CRON ?? '15 10 * * *', {
    name: 'tunnel-accueil',
    timeZone: 'Europe/Paris',
  })
  async envoyer() {
    const debut = Date.now();
    const maintenant = Date.now();
    const jour = 86_400_000;
    const premierDelai = new Date(
      maintenant - TunnelScheduler.DELAI_PREMIER_JOURS * jour,
    );
    const intervalle = new Date(
      maintenant - TunnelScheduler.INTERVALLE_JOURS * jour,
    );
    const plancher = new Date(maintenant - 30 * jour);

    const utilisateurs = await this.prisma.user.findMany({
      where: {
        emailVerified: true,
        hebdoOptIn: true,
        tunnelEtape: { lt: TunnelScheduler.ETAPES },
        createdAt: { lte: premierDelai, gte: plancher },
        status: { notIn: [UserStatus.BANNED, UserStatus.ANONYMIZED] },
        // Soit aucun message n'est encore parti, soit le dernier date d'assez
        // longtemps. C'est cette clause, et elle seule, qui espace la séquence.
        OR: [{ tunnelDernierAt: null }, { tunnelDernierAt: { lte: intervalle } }],
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        tunnelEtape: true,
      },
      // Les plus anciens d'abord : si la boîte d'envoi plafonne, ce sont les
      // séquences déjà commencées qui doivent aboutir, pas les nouvelles.
      orderBy: { createdAt: 'asc' },
      take: 200,
    });

    let envoyes = 0;
    for (const u of utilisateurs) {
      const etape = u.tunnelEtape + 1;
      // L'étape est scellée AVANT l'envoi. Si le message échoue, on ne le
      // rejoue pas : un doublon dans une boîte de réception coûte plus cher
      // qu'un message manquant dans une séquence de six.
      await this.prisma.user.update({
        where: { id: u.id },
        data: { tunnelEtape: etape, tunnelDernierAt: new Date() },
      });
      await this.mail
        .sendTunnelAccueil(u.email, { prenom: u.firstName, etape })
        .catch((e) =>
          this.logger.warn(`tunnel ${u.email} étape ${etape} : ${(e as Error).message}`),
        );
      envoyes += 1;
    }

    this.logger.log(
      `Tunnel d'accueil : ${envoyes} envoi(s) en ${Date.now() - debut} ms`,
    );
    return { envoyes, candidats: utilisateurs.length };
  }
}
