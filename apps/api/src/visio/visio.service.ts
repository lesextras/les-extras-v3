import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { BookingStatus, StatutVisio } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../common/mail/mail.service';
import { AccesSalle, configMedia, signerJetonSalle, tirerIdentifiant } from './livekit';
import { etatFenetre, fenetre, secondesDeValidite, MINUTES_AVANT } from './fenetre';
import { PlanifierVisioDto, AnnulerVisioDto } from './dto/visio.dto';

/**
 * LA VISIOCONSULTATION — planifier, rejoindre, terminer.
 *
 * ⚠⚠ CE N'EST PAS DU SOIN. Ces séances sont de la RÉÉDUCATION et de
 * l'ÉDUCATION SPÉCIALISÉE, en complément de ce que fait déjà l'équipe qui
 * suit la personne. Conséquence directe et non négociable sur ce service :
 * aucun motif, aucun diagnostic, aucun compte rendu clinique n'entre dans ce
 * module. Ajouter un champ « motif de la consultation » ferait basculer la
 * table dans le régime des données de santé (art. 9 RGPD) et obligerait à un
 * hébergement certifié HDS. Ce n'est pas un détail de conformité : c'est ce
 * qui sépare ce dispositif d'un dispositif de télémédecine.
 *
 * ⚠ RIEN N'EST ENREGISTRÉ. Ni le flux, ni sa transcription. L'API ne voit
 * jamais le média — elle signe un jeton, le serveur média transporte (voir
 * `livekit.ts`). Les jetons délivrés portent `roomRecord: false` des deux
 * côtés, donc même l'intervenant ne peut pas déclencher un enregistrement.
 *
 * LE MODÈLE EST CELUI DE DOCTOLIB, dans ses principes :
 *  - une salle par rendez-vous, jamais un lien permanent ;
 *  - un jeton par participant, donc deux liens différents ;
 *  - une fenêtre d'ouverture bornée (`fenetre.ts`) ;
 *  - le demandeur n'a pas besoin de compte : il a reçu son lien.
 */
@Injectable()
export class VisioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  /* ---------------------------------------------------------------- */
  /* Planifier                                                         */
  /* ---------------------------------------------------------------- */

  /**
   * Pose un rendez-vous à distance sur une prestation déjà acceptée.
   *
   * ⚠ SEUL L'INTERVENANT PLANIFIE. C'est lui qui tient son agenda, et c'est
   * lui qui décide si la situation se traite à distance — une première
   * rencontre, une passation de bilan ou une intervention sur le lieu de vie
   * ne se font pas en visio, et il est le seul à pouvoir le dire.
   */
  async planifier(accountId: string, dto: PlanifierVisioDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: {
        service: { select: { accountId: true, title: true, format: true } },
        account: {
          select: { id: true, name: true, owner: { select: { email: true, firstName: true } } },
        },
      },
    });
    if (!booking) throw new NotFoundException('Cette intervention est introuvable.');

    // L'intervenant d'une réservation est le titulaire de la fiche.
    if (!booking.service || booking.service.accountId !== accountId) {
      throw new ForbiddenException(
        "Seul l'intervenant de cette prestation peut proposer un rendez-vous à distance.",
      );
    }

    /*
     * ⚠ UNE VISIO NE S'ACCROCHE QU'À UNE PRESTATION ACCEPTÉE.
     *
     * Sur une demande encore en attente, l'intervention n'est pas convenue :
     * envoyer un lien de rendez-vous ferait croire à un accord qui n'existe
     * pas. Sur une prestation annulée, c'est pire — le lien arrive après la
     * rupture.
     */
    const etatsOuverts: BookingStatus[] = [
      BookingStatus.ACCEPTED,
      BookingStatus.CONFIRMED,
      BookingStatus.IN_PROGRESS,
    ];
    if (!etatsOuverts.includes(booking.status)) {
      throw new BadRequestException(
        "Un rendez-vous à distance ne se pose que sur une intervention acceptée. Celle-ci ne l'est pas (ou plus).",
      );
    }

    const debutPrevu = new Date(dto.debutPrevu);
    if (Number.isNaN(debutPrevu.getTime())) {
      throw new BadRequestException('La date du rendez-vous est illisible.');
    }
    /*
     * ⚠ ON REFUSE LE PASSÉ, MAIS PAS LES QUINZE PROCHAINES MINUTES.
     *
     * La fenêtre s'ouvre déjà quinze minutes avant l'heure prévue : poser un
     * rendez-vous « dans dix minutes » est un usage légitime — quelqu'un
     * rappelle une famille qui vient de manquer sa séance. C'est bien le passé
     * révolu qu'on refuse, pas l'imminence.
     */
    const { ouvertureLe } = fenetre(debutPrevu, dto.dureeMinutes ?? 45);
    if (ouvertureLe.getTime() < Date.now() - 60_000) {
      throw new BadRequestException(
        `Cette date est déjà passée. Un rendez-vous s'ouvre ${MINUTES_AVANT} minutes avant l'heure prévue.`,
      );
    }

    const intervenant = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { name: true },
    });

    const visio = await this.prisma.visioconsultation.create({
      data: {
        bookingId: booking.id,
        salle: tirerIdentifiant('lex-'),
        debutPrevu,
        dureeMinutes: dto.dureeMinutes ?? 45,
        jetonIntervenant: tirerIdentifiant(),
        jetonDemandeur: tirerIdentifiant(),
        intervenantAffiche: intervenant?.name ?? null,
        demandeurAffiche: booking.account?.name ?? null,
      },
    });

    /*
     * Le lien part au demandeur.
     *
     * ⚠ UN ENVOI QUI RATE NE DOIT PAS FAIRE ÉCHOUER LA PLANIFICATION. Le
     * rendez-vous existe, il est dans l'agenda des deux, et l'intervenant a le
     * lien à l'écran — il peut le renvoyer lui-même. L'inverse ferait
     * ressembler un serveur de messagerie lent à un agenda cassé.
     */
    const courrielDemandeur = booking.account?.owner?.email;
    if (courrielDemandeur) {
      await this.mail
        .sendInvitationVisio(courrielDemandeur, {
          jeton: visio.jetonDemandeur,
          debutPrevu,
          dureeMinutes: visio.dureeMinutes,
          intitule: booking.service?.title ?? 'Votre accompagnement',
          intervenant: intervenant?.name ?? "L'intervenant",
        })
        .catch(() => undefined);
    }

    return this.vueIntervenant(visio.id);
  }

  /* ---------------------------------------------------------------- */
  /* Lire                                                              */
  /* ---------------------------------------------------------------- */

  /** Les rendez-vous à distance d'un compte intervenant, à venir d'abord. */
  async mesVisios(accountId: string) {
    const visios = await this.prisma.visioconsultation.findMany({
      where: { booking: { service: { accountId } } },
      orderBy: { debutPrevu: 'desc' },
      take: 100,
      include: {
        booking: {
          select: {
            id: true,
            status: true,
            service: { select: { title: true } },
            account: { select: { name: true } },
          },
        },
      },
    });
    return visios.map((v) => ({
      id: v.id,
      debutPrevu: v.debutPrevu,
      dureeMinutes: v.dureeMinutes,
      statut: v.statut,
      intitule: v.booking?.service?.title ?? null,
      demandeur: v.demandeurAffiche ?? v.booking?.account?.name ?? null,
      etatFenetre: etatFenetre(v.debutPrevu, v.dureeMinutes),
      // ⚠ Le lien du DEMANDEUR est rendu à l'intervenant, qui doit pouvoir le
      // renvoyer quand un courriel se perd. Le sien ne sort pas d'ici : il
      // l'obtient en rejoignant, contre sa session.
      lienDemandeur: `/visio/${v.jetonDemandeur}`,
      lienIntervenant: `/visio/${v.jetonIntervenant}`,
    }));
  }

  private async vueIntervenant(id: string) {
    const v = await this.prisma.visioconsultation.findUniqueOrThrow({
      where: { id },
      include: { booking: { select: { service: { select: { title: true } } } } },
    });
    return {
      id: v.id,
      debutPrevu: v.debutPrevu,
      dureeMinutes: v.dureeMinutes,
      statut: v.statut,
      intitule: v.booking?.service?.title ?? null,
      lienDemandeur: `/visio/${v.jetonDemandeur}`,
      lienIntervenant: `/visio/${v.jetonIntervenant}`,
    };
  }

  /* ---------------------------------------------------------------- */
  /* Le lien reçu — sans compte                                        */
  /* ---------------------------------------------------------------- */

  /**
   * Ce que la page du lien affiche AVANT d'entrer dans la salle.
   *
   * ⚠ AUCUN SECRET N'EST DÉLIVRÉ ICI, et c'est ce qui permet d'appeler cette
   * route en boucle depuis la salle d'attente pour savoir quand la porte
   * s'ouvre. Le jeton du serveur média ne se demande qu'au moment d'entrer.
   *
   * ⚠ UN JETON INCONNU REND 404, SANS DIRE S'IL A EXISTÉ. Distinguer
   * « jamais vu » de « périmé » dirait à qui essaie des liens au hasard quand
   * il a touché juste.
   */
  async etatParJeton(jeton: string) {
    const v = await this.trouverParJeton(jeton);
    const role = v.jetonIntervenant === jeton ? 'intervenant' : 'demandeur';
    const f = fenetre(v.debutPrevu, v.dureeMinutes);
    return {
      role,
      statut: v.statut,
      debutPrevu: v.debutPrevu,
      dureeMinutes: v.dureeMinutes,
      ouvertureLe: f.ouvertureLe,
      fermetureLe: f.fermetureLe,
      etat: etatFenetre(v.debutPrevu, v.dureeMinutes),
      annulationMotif: v.annulationMotif,
      // Le nom d'en face, pour que personne n'entre sans savoir qui il rejoint.
      enFace: role === 'demandeur' ? v.intervenantAffiche : v.demandeurAffiche,
      // La visio est-elle ouverte par l'intervenant ? C'est ce que la salle
      // d'attente affiche au demandeur.
      salleOuverte: v.statut === StatutVisio.EN_COURS,
      /*
       * ⚠ DIT AU DEMANDEUR CE QUE CE RENDEZ-VOUS N'EST PAS. La page le répète
       * parce que c'est le moment où quelqu'un est le plus susceptible de
       * croire qu'il va voir un médecin.
       */
      nature:
        "Séance de rééducation ou d'éducation spécialisée. Ce n'est pas une consultation médicale : aucun diagnostic n'est posé et aucune prescription n'est délivrée.",
    };
  }

  /**
   * Entrer dans la salle.
   *
   * ⚠ C'EST ICI, ET NULLE PART AILLEURS, QUE LES TROIS VERROUS TOMBENT :
   * le rendez-vous n'est pas annulé, la fenêtre est ouverte, le serveur média
   * est configuré. Les trois rendent un message différent — « annulé »,
   * « pas encore » et « indisponible » ne se réparent pas de la même façon,
   * et un message unique ferait appeler le secrétariat dans les trois cas.
   */
  async rejoindre(jeton: string, prenomAffiche?: string): Promise<AccesSalle> {
    const v = await this.trouverParJeton(jeton);

    if (v.statut === StatutVisio.ANNULEE) {
      throw new BadRequestException(
        v.annulationMotif
          ? `Ce rendez-vous a été annulé : ${v.annulationMotif}`
          : 'Ce rendez-vous a été annulé.',
      );
    }

    const etat = etatFenetre(v.debutPrevu, v.dureeMinutes);
    if (etat === 'TROP_TOT') {
      const { ouvertureLe } = fenetre(v.debutPrevu, v.dureeMinutes);
      throw new BadRequestException(
        `La salle ouvre ${MINUTES_AVANT} minutes avant le rendez-vous, soit à ${ouvertureLe.toLocaleTimeString(
          'fr-FR',
          { hour: '2-digit', minute: '2-digit' },
        )}.`,
      );
    }
    if (etat === 'TERMINEE') {
      throw new BadRequestException(
        "Ce rendez-vous est terminé. Le lien ne fonctionne plus : demandez-en un nouveau à l'intervenant.",
      );
    }

    const config = configMedia();
    if (!config) {
      /*
       * ⚠ 503, PAS 500 : le service n'est pas en panne, il n'est pas en
       * service. Les trois variables d'environnement ne sont pas posées, et
       * c'est l'état normal tant que la visio n'est pas ouverte.
       */
      throw new ServiceUnavailableException(
        "La visioconsultation n'est pas encore activée. L'intervenant vous proposera un autre créneau.",
      );
    }

    const animateur = v.jetonIntervenant === jeton;

    /*
     * ⚠ L'IDENTITÉ AFFICHÉE EST NETTOYÉE, ET BORNÉE À 40 CARACTÈRES. Elle est
     * montrée à tous les participants : un champ libre non borné laisse
     * quelqu'un écrire n'importe quoi dans la salle de quelqu'un d'autre. Les
     * chevrons et les retours à la ligne sautent.
     */
    const identite =
      (prenomAffiche ?? '')
        .replace(/[<>\r\n]/g, ' ')
        .trim()
        .slice(0, 40) ||
      (animateur ? (v.intervenantAffiche ?? 'Intervenant') : (v.demandeurAffiche ?? 'Participant'));

    // L'intervenant qui entre le premier ouvre la salle.
    if (animateur && v.statut === StatutVisio.PLANIFIEE) {
      await this.prisma.visioconsultation.update({
        where: { id: v.id },
        data: { statut: StatutVisio.EN_COURS, ouverteLe: new Date() },
      });
    }

    return {
      url: config.url,
      salle: v.salle,
      identite,
      jeton: signerJetonSalle(config, {
        salle: v.salle,
        identite,
        secondes: secondesDeValidite(v.debutPrevu, v.dureeMinutes),
        animateur,
      }),
    };
  }

  /* ---------------------------------------------------------------- */
  /* Terminer, annuler                                                 */
  /* ---------------------------------------------------------------- */

  /** L'intervenant ferme la salle. Idempotent : refermer ne casse rien. */
  async terminer(accountId: string, id: string) {
    const v = await this.exigerIntervenant(accountId, id);
    if (v.statut === StatutVisio.TERMINEE || v.statut === StatutVisio.ANNULEE) {
      return this.vueIntervenant(v.id);
    }
    await this.prisma.visioconsultation.update({
      where: { id: v.id },
      data: { statut: StatutVisio.TERMINEE, termineeLe: new Date() },
    });
    return this.vueIntervenant(v.id);
  }

  /**
   * Annuler.
   *
   * ⚠ ON N'EFFACE PAS, ON ANNULE. Le rendez-vous reste, avec son motif et sa
   * date : c'est ce qui permet de répondre à « on avait rendez-vous mardi,
   * que s'est-il passé ? ». Une ligne supprimée ne répond à rien.
   */
  async annuler(accountId: string, id: string, dto: AnnulerVisioDto) {
    const v = await this.exigerIntervenant(accountId, id);
    if (v.statut === StatutVisio.TERMINEE) {
      throw new BadRequestException("Ce rendez-vous est déjà terminé : il n'y a rien à annuler.");
    }
    await this.prisma.visioconsultation.update({
      where: { id: v.id },
      data: {
        statut: StatutVisio.ANNULEE,
        annulationMotif: dto.motif?.trim() || null,
      },
    });
    return this.vueIntervenant(v.id);
  }

  /* ---------------------------------------------------------------- */

  private async trouverParJeton(jeton: string) {
    const propre = (jeton ?? '').trim();
    // Les jetons font 32 caractères hexadécimaux : tout le reste est écarté
    // avant d'atteindre la base.
    if (!/^[0-9a-f]{32}$/.test(propre)) {
      throw new NotFoundException("Ce lien de rendez-vous n'est pas valide.");
    }
    const v = await this.prisma.visioconsultation.findFirst({
      where: { OR: [{ jetonIntervenant: propre }, { jetonDemandeur: propre }] },
    });
    if (!v) throw new NotFoundException("Ce lien de rendez-vous n'est pas valide.");
    return v;
  }

  private async exigerIntervenant(accountId: string, id: string) {
    const v = await this.prisma.visioconsultation.findUnique({
      where: { id },
      include: { booking: { select: { service: { select: { accountId: true } } } } },
    });
    if (!v) throw new NotFoundException('Ce rendez-vous est introuvable.');
    if (v.booking?.service?.accountId !== accountId) {
      throw new ForbiddenException("Ce rendez-vous n'est pas le vôtre.");
    }
    return v;
  }
}
