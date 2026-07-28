import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AccountType, MissionStatus, QuestionStatus, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../common/mail/mail.service';

/**
 * LE RENDEZ-VOUS DU LUNDI.
 *
 * Un logiciel qu'on ouvre seulement « quand on a un problème » n'entre jamais
 * dans les habitudes. Cet e-mail est le déclencheur : une fois par semaine,
 * groupé, avec uniquement ce qui concerne la personne.
 *
 * Trois règles tenues par ce planificateur :
 *  1. Un seul envoi hebdomadaire, jamais de rattrapage.
 *  2. Rien à dire → rien d'envoyé. Le silence vaut mieux qu'un message vide.
 *  3. Désactivable en un clic (User.hebdoOptIn).
 */
@Injectable()
export class HebdoScheduler {
  private readonly logger = new Logger(HebdoScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  /** Lundi 7 h 30 (heure de Paris) — avant la prise de poste. */
  @Cron(process.env.HEBDO_CRON ?? '30 7 * * 1', {
    name: 'rendez-vous-hebdomadaire',
    timeZone: 'Europe/Paris',
  })
  async envoyer() {
    const debut = Date.now();
    const semaine = new Date(Date.now() - 7 * 86_400_000);

    const utilisateurs = await this.prisma.user.findMany({
      where: {
        hebdoOptIn: true,
        status: { notIn: [UserStatus.BANNED, UserStatus.ANONYMIZED] },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        profile: { select: { job: true, city: true } },
        memberships: {
          where: { status: 'ACTIVE' },
          select: { account: { select: { id: true, type: true, city: true, points: true } } },
        },
      },
    });

    // Contenus communs, lus une seule fois pour tout le monde.
    const [missions, questions, formations] = await Promise.all([
      this.prisma.reliefMission.findMany({
        where: { status: MissionStatus.PUBLISHED, startDate: { gte: new Date() } },
        orderBy: { createdAt: 'desc' },
        take: 40,
        select: { id: true, title: true, city: true, job: true },
      }),
      this.prisma.question.findMany({
        where: { status: QuestionStatus.OUVERTE, answers: { none: {} } },
        orderBy: { createdAt: 'desc' },
        take: 40,
        select: { id: true, title: true, metier: true },
      }),
      this.prisma.formation.findMany({
        where: { createdAt: { gte: semaine } },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { slug: true, title: true },
      }),
    ]);

    const web = process.env.APP_WEB_URL ?? 'https://app.les-extras.fr';
    const nouveautes = formations.map((f) => ({
      titre: `Nouvelle formation : ${f.title}`,
      lien: `${web}/formations/${f.slug}`,
    }));

    let envoyes = 0;
    for (const u of utilisateurs) {
      const compte = u.memberships[0]?.account;
      if (!compte) continue;
      const ville = compte.city ?? u.profile?.city ?? null;
      const metier = u.profile?.job ?? null;

      // Un établissement ne reçoit pas d'offres de missions : il en publie.
      const sesMissions =
        compte.type === AccountType.FREELANCE
          ? missions
              .filter((m) => (ville ? m.city === ville : true))
              .slice(0, 3)
              .map((m) => ({ titre: m.title, ville: m.city, id: m.id }))
          : [];

      // Priorité aux questions de son métier, complétées par les autres.
      const sesQuestions = [
        ...questions.filter((q) => metier && q.metier === metier),
        ...questions.filter((q) => !metier || q.metier !== metier),
      ]
        .slice(0, 3)
        .map((q) => ({ titre: q.title, metier: q.metier, id: q.id }));

      // Règle n°2 : rien à dire, rien d'envoyé.
      if (sesMissions.length + sesQuestions.length + nouveautes.length === 0) continue;

      await this.mail
        .sendRendezVousHebdo(u.email, {
          prenom: u.firstName,
          missions: sesMissions,
          questions: sesQuestions,
          nouveautes,
          points: compte.points,
        })
        .catch((e) => this.logger.warn(`hebdo ${u.email} : ${(e as Error).message}`));
      envoyes += 1;
    }

    this.logger.log(
      `Rendez-vous hebdomadaire : ${envoyes}/${utilisateurs.length} envoi(s) en ${Date.now() - debut} ms`,
    );
    return { envoyes, candidats: utilisateurs.length };
  }
}
