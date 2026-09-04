import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../common/mail/mail.service';

/**
 * LA SÉQUENCE D'ACCUEIL POUR QUI A DEMANDÉ UNE FICHE SANS CRÉER DE COMPTE.
 *
 * Même séquence, mêmes six messages, mêmes règles que `TunnelScheduler` — un
 * seul message par passage, un compteur et non un calendrier, l'étape scellée
 * avant l'envoi. Ce qui change, et qui justifie un planificateur séparé plutôt
 * qu'un `OR` dans le premier :
 *
 *  1. **L'opt-in est EXPLICITE et décoché par défaut.** Un compte a coché ses
 *     conditions ; une personne qui a juste demandé une fiche n'a rien accepté
 *     d'autre que cette fiche. Sans `consentTunnel`, rien ne part, jamais.
 *  2. **Le désabonnement se fait par jeton**, sans compte ni mot de passe : le
 *     lien mène à `/desinscription?j=…`, pas au profil.
 *  3. **Une adresse, une séquence.** Une personne qui a demandé trois fiches
 *     ne reçoit pas trois fois la série : on regroupe par adresse et on scelle
 *     toutes ses lignes d'un coup.
 *  4. **Une adresse qui a un compte ne reçoit pas la séquence d'ici.** C'est
 *     `TunnelScheduler` qui s'en occupe, avec les réglages du compte.
 *
 * Plancher de 60 jours (plus large que les 30 des comptes) : une fiche demandée
 * se rappelle plus longtemps qu'une inscription.
 */
@Injectable()
export class CapturesScheduler {
  private readonly logger = new Logger(CapturesScheduler.name);

  private static readonly ETAPES = 6;
  private static readonly INTERVALLE_JOURS = 3;
  private static readonly DELAI_PREMIER_JOURS = 3;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  /** 10 h 30, entre le tunnel des comptes (10 h 15) et l'enquête (10 h 45). */
  @Cron(process.env.CAPTURES_CRON ?? '30 10 * * *', {
    name: 'tunnel-captures',
    timeZone: 'Europe/Paris',
  })
  async envoyer() {
    const debut = Date.now();
    const jour = 86_400_000;
    const premierDelai = new Date(Date.now() - CapturesScheduler.DELAI_PREMIER_JOURS * jour);
    const intervalle = new Date(Date.now() - CapturesScheduler.INTERVALLE_JOURS * jour);
    const plancher = new Date(Date.now() - 60 * jour);

    const lignes = await this.prisma.captureFiche.findMany({
      where: {
        consentTunnel: true,
        desabonneAt: null,
        tunnelEtape: { lt: CapturesScheduler.ETAPES },
        consentAt: { lte: premierDelai, gte: plancher },
        OR: [{ tunnelDernierAt: null }, { tunnelDernierAt: { lte: intervalle } }],
      },
      select: { email: true, prenom: true, tunnelEtape: true, jeton: true },
      orderBy: { consentAt: 'asc' },
      take: 400,
    });

    // Une adresse, une séquence : la première ligne de chaque adresse porte
    // l'étape, les autres suivent.
    const parAdresse = new Map<string, (typeof lignes)[number]>();
    for (const l of lignes) if (!parAdresse.has(l.email)) parAdresse.set(l.email, l);
    const adresses = [...parAdresse.keys()];
    if (adresses.length === 0) return { envoyes: 0, candidats: 0 };

    const comptes = await this.prisma.user.findMany({
      where: { email: { in: adresses } },
      select: { email: true },
    });
    const aUnCompte = new Set(comptes.map((c) => c.email.toLowerCase()));

    let envoyes = 0;
    for (const [email, l] of parAdresse) {
      if (aUnCompte.has(email)) continue;
      const etape = l.tunnelEtape + 1;
      // Scellé AVANT l'envoi, sur toutes les lignes de l'adresse.
      await this.prisma.captureFiche.updateMany({
        where: { email },
        data: { tunnelEtape: etape, tunnelDernierAt: new Date() },
      });
      await this.mail
        .sendTunnelAccueil(email, {
          prenom: l.prenom,
          etape,
          desabonnement: {
            url: `${this.mail.webUrl}/desinscription?j=${l.jeton}`,
            motif:
              'Vous recevez ce message parce que vous avez demandé une fiche récap sur Les Extras et coché « recevoir les parcours suivants ».',
          },
        })
        .catch((e) =>
          this.logger.warn(`captures ${email} étape ${etape} : ${(e as Error).message}`),
        );
      envoyes += 1;
    }

    this.logger.log(`Séquence captures : ${envoyes} envoi(s) en ${Date.now() - debut} ms`);
    return { envoyes, candidats: parAdresse.size };
  }
}
