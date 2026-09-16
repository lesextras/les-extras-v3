import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StatutAttestation } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../common/mail/mail.service';
import { CommanderAttestationDto } from './dto/attestation.dto';

/**
 * L'ATTESTATION DE SUIVI — la vendre, l'encaisser, la délivrer.
 *
 * ⚠⚠ CE QUI EST VENDU EST UNE ATTESTATION DE SUIVI, JAMAIS UN CERTIFICAT, et
 * cette règle vaut jusque dans les noms de variables. Un « certificat »
 * désigne en France une certification enregistrée au RNCP ou au Répertoire
 * spécifique, délivrée par un organisme habilité par France Compétences.
 * Qualiopi certifie la QUALITÉ DU PROCESSUS d'un organisme de formation et
 * n'autorise à délivrer aucun titre. Vendre vingt euros un document présenté
 * comme un certificat serait une pratique commerciale trompeuse (art. L121-1
 * c. conso) — retenue d'autant plus lourdement contre un organisme justement
 * certifié Qualiopi.
 *
 * ⚠ LA VENTE EST FERMÉE TANT QUE `Formation.attestationPrixCents` EST NUL, et
 * c'est le défaut sur toutes les fiches. Ce n'est pas une précaution de
 * développement : vendre à un particulier oblige à nommer dans les CGV un
 * médiateur de la consommation référencé par la CECMC (art. L612-1 c. conso).
 * Aucun ne l'est à ce jour. Le tunnel est construit et attend une décision qui
 * n'est pas technique.
 */
@Injectable()
export class AttestationsService {
  private readonly logger = new Logger(AttestationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  /**
   * LE DÉLAI DE RÉTRACTATION — quatorze jours, et il ne se négocie pas.
   *
   * Art. L221-18 c. conso. Il ne s'éteint que sur demande expresse
   * d'exécution immédiate (L221-25, L221-28 1°) — d'où la case, décochée par
   * défaut, que seul l'acheteur coche.
   */
  static readonly JOURS_RETRACTATION = 14;

  /** Le délai annoncé dans les CGV pour délivrer le document. */
  static readonly JOURS_OUVRES_DELIVRANCE = 15;

  private get cleStripe(): string {
    const cle = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!cle) {
      throw new ServiceUnavailableException(
        'Le paiement en ligne n’est pas configuré. Écrivez-nous et nous vous répondrons.',
      );
    }
    return cle;
  }

  /**
   * Appel REST à Stripe, form-encodé — le dépôt n'embarque pas le SDK, et il
   * ne faut pas l'ajouter pour une seule route : le module billing fait déjà
   * exactement ceci depuis un an.
   */
  private async stripe(
    chemin: string,
    params: Record<string, string>,
  ): Promise<Record<string, unknown>> {
    const reponse = await fetch(`https://api.stripe.com/v1${chemin}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.cleStripe}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(params).toString(),
    });
    const corps = (await reponse.json()) as Record<string, unknown>;
    if (!reponse.ok) {
      const erreur = corps?.error as { message?: string } | undefined;
      this.logger.error(`Stripe ${chemin} : ${erreur?.message ?? reponse.status}`);
      throw new ServiceUnavailableException(
        'Le paiement n’a pas pu être ouvert. Réessayez dans un instant.',
      );
    }
    return corps;
  }

  private get urlWeb(): string {
    return this.config.get<string>('APP_WEB_URL') ?? 'https://les-extras.fr';
  }

  /**
   * COMMANDER — ouvre le paiement, et rien d'autre.
   *
   * ⚠ AUCUN COMPTE N'EST EXIGÉ, ET C'EST STRUCTUREL. Les parcours gratuits se
   * suivent sur la plateforme pédagogique de l'association ; on y arrive par
   * le bouton de la fiche publique, sans jamais créer de compte ici. Exiger un
   * compte pour acheter le document qui atteste du parcours qu'on vient de
   * finir ferait abandonner presque tout le monde, et il n'y aurait rien à
   * rattacher : l'attestation nomme une personne, elle n'ouvre aucun accès.
   */
  async commander(dto: CommanderAttestationDto) {
    const formation = await this.prisma.formation.findFirst({
      where: { OR: [{ id: dto.formation }, { slug: dto.formation }] },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        freeOnline: true,
        attestationPrixCents: true,
      },
    });
    if (!formation || formation.status !== 'PUBLISHED') {
      throw new NotFoundException('Formation introuvable.');
    }

    // L'interrupteur. Un prix nul ferme la vente : la route répond comme si
    // elle n'existait pas pour cette fiche, et l'écran n'affiche pas le bouton.
    if (!formation.attestationPrixCents || formation.attestationPrixCents <= 0) {
      throw new BadRequestException(
        'L’attestation n’est pas encore en vente pour ce parcours. Écrivez-nous et nous vous répondrons.',
      );
    }

    const email = dto.email.trim().toLowerCase();
    const prenom = dto.prenom.trim();
    const nom = dto.nom.trim();

    /**
     * ⚠ UNE COMMANDE DÉJÀ PAYÉE NE SE REPAIE PAS. Quelqu'un qui reclique le
     * bouton après avoir payé ne doit pas être débité une seconde fois pour le
     * même document — il doit voir l'état de sa commande.
     */
    const dejaPayee = await this.prisma.demandeAttestation.findFirst({
      where: {
        formationId: formation.id,
        email,
        statut: { in: [StatutAttestation.PAYEE, StatutAttestation.DELIVREE] },
      },
      select: { id: true, statut: true },
    });
    if (dejaPayee) {
      return {
        deja: true,
        statut: dejaPayee.statut,
        message:
          dejaPayee.statut === StatutAttestation.DELIVREE
            ? 'Votre attestation a déjà été envoyée à cette adresse.'
            : 'Votre commande est déjà payée : l’attestation vous parvient sous quinze jours ouvrés.',
      };
    }

    const demande = await this.prisma.demandeAttestation.create({
      data: {
        formationId: formation.id,
        email,
        prenom,
        nom,
        montantCents: formation.attestationPrixCents,
        renonciationRetractation: dto.renonciationRetractation === true,
      },
      select: { id: true },
    });

    const retour = `${this.urlWeb}/formations/${formation.slug ?? formation.id}`;
    const session = await this.stripe('/checkout/sessions', {
      mode: 'payment',
      'payment_method_types[0]': 'card',
      // L'adresse identifie l'acheteur : c'est elle qui reçoit le reçu Stripe,
      // puis le document. Sans compte, c'est la seule identité qu'on ait.
      customer_email: email,
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': 'eur',
      'line_items[0][price_data][unit_amount]': String(formation.attestationPrixCents),
      'line_items[0][price_data][product_data][name]':
        `Attestation de suivi — ${formation.title}`,
      'line_items[0][price_data][product_data][description]':
        'Document nominatif attestant du suivi du parcours. Ni diplôme, ni certification professionnelle.',
      success_url: `${retour}?attestation=succes`,
      cancel_url: `${retour}?attestation=annule`,
      'metadata[kind]': 'attestation',
      'metadata[demandeId]': demande.id,
    });

    await this.prisma.demandeAttestation.update({
      where: { id: demande.id },
      data: { stripeSessionId: String(session.id) },
    });

    return { url: String(session.url) };
  }

  /**
   * LE PAIEMENT EST CONFIRMÉ — appelé par le webhook, et par lui seul.
   *
   * ⚠ L'IDEMPOTENCE TIENT AU VERROU SUR LE STATUT, comme pour les packs de
   * crédits : une relivraison de Stripe retombe sur une commande déjà PAYEE et
   * ne fait rien. La contrainte d'unicité sur `stripeSessionId` ferme l'autre
   * moitié du problème.
   */
  async confirmerPaiement(stripeSessionId: string) {
    const demande = await this.prisma.demandeAttestation.findUnique({
      where: { stripeSessionId },
      include: { formation: { select: { title: true } } },
    });
    if (!demande) {
      this.logger.warn(`Webhook attestation : session inconnue ${stripeSessionId}`);
      return { ignored: 'inconnue' };
    }
    if (demande.statut !== StatutAttestation.EN_ATTENTE_PAIEMENT) {
      return { ignored: 'deja_traite' };
    }

    /**
     * LA DATE À PARTIR DE LAQUELLE ON PEUT DÉLIVRER.
     *
     * ⚠ SANS RENONCIATION EXPRESSE, ON ATTEND LES QUATORZE JOURS. Délivrer
     * avant éteindrait de fait un droit que l'acheteur n'a pas abandonné :
     * l'article L221-28 1° ne libère le professionnel que si le consommateur a
     * « expressément demandé » l'exécution immédiate ET reconnu qu'il perdait
     * son droit. La case, décochée par défaut, est cette demande.
     */
    const maintenant = new Date();
    const livrableLe = demande.renonciationRetractation
      ? maintenant
      : new Date(
          maintenant.getTime() +
            AttestationsService.JOURS_RETRACTATION * 24 * 60 * 60 * 1000,
        );

    await this.prisma.demandeAttestation.update({
      where: { id: demande.id },
      data: { statut: StatutAttestation.PAYEE, payeeLe: maintenant, livrableLe },
    });

    await this.mail
      .sendAttestationCommandee({
        to: demande.email,
        prenom: demande.prenom,
        formation: demande.formation.title,
        montantCents: demande.montantCents,
        renonciation: demande.renonciationRetractation,
        livrableLe,
      })
      .catch(() => undefined);

    this.logger.log(
      `Attestation payée : ${demande.email} — ${demande.formation.title}`,
    );
    return { received: true };
  }

  /** La file d'administration : ce qui attend une délivrance, d'abord. */
  async lister() {
    return this.prisma.demandeAttestation.findMany({
      orderBy: [{ statut: 'asc' }, { payeeLe: 'asc' }, { createdAt: 'desc' }],
      take: 200,
      include: { formation: { select: { id: true, title: true, slug: true } } },
    });
  }

  /**
   * DÉLIVRER — et refuser tant que le délai de rétractation court.
   *
   * ⚠ LE REFUS N'EST PAS UNE PRÉCAUTION, C'EST LA RÈGLE. Délivrer avant la fin
   * des quatorze jours, sans renonciation expresse, revient à exécuter un
   * contrat que l'acheteur peut encore annuler — et à lui opposer ensuite une
   * exécution qu'il n'a pas demandée.
   */
  async delivrer(id: string) {
    const demande = await this.prisma.demandeAttestation.findUnique({
      where: { id },
      include: { formation: { select: { title: true, slug: true } } },
    });
    if (!demande) throw new NotFoundException('Commande introuvable.');
    if (demande.statut === StatutAttestation.DELIVREE) {
      return { deja: true };
    }
    if (demande.statut !== StatutAttestation.PAYEE) {
      throw new BadRequestException(
        'Cette commande n’est pas payée : il n’y a rien à délivrer.',
      );
    }
    if (demande.livrableLe && demande.livrableLe > new Date()) {
      throw new BadRequestException(
        `Le délai de rétractation court jusqu’au ${demande.livrableLe.toLocaleDateString('fr-FR')}. ` +
          'L’acheteur n’a pas demandé l’exécution immédiate : délivrer maintenant lui retirerait un droit qu’il a gardé.',
      );
    }

    await this.prisma.demandeAttestation.update({
      where: { id },
      data: { statut: StatutAttestation.DELIVREE, delivreeLe: new Date() },
    });

    await this.mail
      .sendAttestationDelivree({
        to: demande.email,
        prenom: demande.prenom,
        nom: demande.nom,
        formation: demande.formation.title,
      })
      .catch(() => undefined);

    return { delivree: true };
  }

  /**
   * ANNULER — rétractation exercée, ou remboursement décidé.
   *
   * ⚠ ON NE SUPPRIME PAS LA LIGNE. Une commande payée fait partie de la
   * comptabilité : elle s'annule avec son motif et sa date, elle ne s'efface
   * pas. Le remboursement lui-même se fait dans Stripe, à la main — aucune
   * route de ce dépôt ne rend d'argent toute seule.
   */
  async annuler(id: string, motif?: string) {
    const demande = await this.prisma.demandeAttestation.findUnique({ where: { id } });
    if (!demande) throw new NotFoundException('Commande introuvable.');
    return this.prisma.demandeAttestation.update({
      where: { id },
      data: {
        statut: StatutAttestation.ANNULEE,
        annuleeLe: new Date(),
        motif: motif?.trim() || null,
      },
    });
  }
}
