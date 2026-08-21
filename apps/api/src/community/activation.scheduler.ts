import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AccountType, MembershipStatus, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../common/mail/mail.service';

/**
 * L'E-MAIL D'ACTIVATION DU LENDEMAIN.
 *
 * Le rendez-vous du lundi RETIENT ; rien n'ACTIVAIT. Or le lendemain de
 * l'inscription est le moment au meilleur rendement : l'élan du premier jour
 * est retombé, le souvenir est encore frais. Un seul message, différent par
 * type de compte, qui ne demande qu'une chose — celle qui débloque le reste.
 *
 * Règles tenues par ce planificateur, cousines de celles du lundi :
 *  1. UN message dans la vie du compte, jamais de deuxième chance :
 *     `User.activationMailAt` scelle la décision — envoyée OU non — et on ne
 *     revient jamais dessus.
 *  2. Le premier geste est déjà fait → rien d'envoyé. Féliciter serait du
 *     bruit ; demander ce qui est fait apprendrait qu'on ne regarde pas.
 *  3. Adresse non confirmée → rien d'envoyé (l'e-mail de confirmation joue ce
 *     rôle, et écrire à une adresse douteuse abîme la délivrabilité de tous).
 *  4. Plancher de 7 jours : au premier déploiement, les comptes anciens ne
 *     reçoivent pas un « bienvenue » qui arriverait des mois trop tard.
 */
@Injectable()
export class ActivationScheduler {
  private readonly logger = new Logger(ActivationScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  /** Tous les jours à 9 h 15 (heure de Paris) — après l'arrivée au bureau. */
  @Cron(process.env.ACTIVATION_CRON ?? '15 9 * * *', {
    name: 'activation-j1',
    timeZone: 'Europe/Paris',
  })
  async envoyer() {
    const debut = Date.now();
    const maintenant = Date.now();
    const hier = new Date(maintenant - 24 * 3_600_000);
    const plancher = new Date(maintenant - 7 * 86_400_000);

    const utilisateurs = await this.prisma.user.findMany({
      where: {
        activationMailAt: null,
        createdAt: { lte: hier, gte: plancher },
        status: { notIn: [UserStatus.BANNED, UserStatus.ANONYMIZED] },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        emailVerified: true,
        profile: { select: { job: true, city: true, diplomaUrl: true } },
        ownedAccounts: {
          select: { id: true, type: true, profilSalarie: true },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
        memberships: {
          where: { status: MembershipStatus.ACTIVE },
          select: { account: { select: { type: true } } },
        },
      },
    });

    // Les besoins déjà publiés par les établissements du lot, en une requête.
    const idsEtablissements = utilisateurs
      .map((u) => u.ownedAccounts[0])
      .filter((a) => a?.type === AccountType.ESTABLISHMENT)
      .map((a) => a.id);
    const missionsPubliees = idsEtablissements.length
      ? await this.prisma.reliefMission.groupBy({
          by: ['accountId'],
          where: { accountId: { in: idsEtablissements } },
          _count: { _all: true },
        })
      : [];
    const aDejaPublie = new Set(missionsPubliees.map((m) => m.accountId));

    let envoyes = 0;
    for (const u of utilisateurs) {
      const compte = u.ownedAccounts[0];
      const decision = this.decider(u, compte, aDejaPublie);
      if (decision) {
        await this.mail
          .sendActivationJ1(u.email, { prenom: u.firstName, variante: decision })
          .catch((e) => this.logger.warn(`activation ${u.email} : ${(e as Error).message}`));
        envoyes += 1;
      }
    }

    // La décision est prise pour tout le lot — envoyée ou non, elle ne se
    // reprend jamais : ce message n'existe qu'une fois dans la vie du compte.
    if (utilisateurs.length) {
      await this.prisma.user.updateMany({
        where: { id: { in: utilisateurs.map((u) => u.id) } },
        data: { activationMailAt: new Date() },
      });
    }

    this.logger.log(
      `Activation J+1 : ${envoyes}/${utilisateurs.length} envoi(s) en ${Date.now() - debut} ms`,
    );
    return { envoyes, candidats: utilisateurs.length };
  }

  /**
   * La variante à envoyer, ou null pour s'abstenir. EXPORTÉE DE FAIT par sa
   * visibilité de module (via l'instance) pour être testée seule : c'est ici
   * que vivent les règles, l'envoi n'est que de la plomberie.
   */
  decider(
    u: {
      emailVerified: boolean;
      profile: { job: string | null; city: string | null; diplomaUrl: string | null } | null;
      memberships: { account: { type: AccountType } | null }[];
    },
    compte: { id: string; type: AccountType; profilSalarie: boolean } | undefined,
    aDejaPublie: Set<string>,
  ): 'etablissement' | 'independant' | 'salarie' | null {
    // Règle 3 : adresse non confirmée, on n'écrit pas.
    if (!u.emailVerified) return null;
    // Invité par sa structure, sans compte à lui : son activation, c'est le
    // rattachement — déjà fait par définition. Rien à demander.
    if (!compte) return null;

    if (compte.type === AccountType.ESTABLISHMENT) {
      // Premier besoin déjà publié : le geste est fait, silence.
      return aDejaPublie.has(compte.id) ? null : 'etablissement';
    }

    if (compte.profilSalarie) {
      // Déjà rattaché à un établissement : le geste est fait, silence.
      const rattache = u.memberships.some(
        (m) => m.account?.type === AccountType.ESTABLISHMENT,
      );
      return rattache ? null : 'salarie';
    }

    // Indépendant : le geste est le dossier. Complet (métier, ville, diplôme),
    // il est déjà « devant » — silence.
    const dossierComplet = Boolean(
      u.profile?.job && u.profile?.city && u.profile?.diplomaUrl,
    );
    return dossierComplet ? null : 'independant';
  }
}
