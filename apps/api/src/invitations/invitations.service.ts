import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import {
  AccountRole,
  Capacite,
  InvitationStatus,
  MembershipStatus,
  NiveauResponsabilite,
  OrigineVerification,
  PorteeService,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../common/mail/mail.service';
import { RequestAccount, RequestUser } from '../common/types/request-context';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import {
  SELECT_MEMBRE,
  versMembreCourant,
  estDirection,
  peutPiloterService,
  capacitesDelegables,
  niveauDelegable,
  niveauValideDOffice,
  capacitesEffectives,
  MembreCourant,
} from '../common/perimetre';

/**
 * L'INVITATION EST LA SOURCE DE LA VISIBILITÉ.
 *
 * Tout le modèle d'organisation repose dessus : on voit les gens qu'on a fait
 * venir, et eux seuls. Un chef de service qui arrive seul n'attend donc
 * personne — il crée ses services, il invite son équipe, elle accepte, il la
 * voit. Aucune validation d'en haut n'est requise, et c'est sans risque :
 * quelqu'un qui se déclarerait responsable sans l'être ne pourrait constituer
 * un périmètre qu'avec des gens ayant accepté son invitation.
 *
 * Trois règles tiennent l'ensemble, toutes appliquées ICI et jamais ailleurs :
 *
 *   1. ON N'INVITE PAS PLUS HAUT QUE SOI (`niveauDelegable`).
 *   2. ON NE DÉLÈGUE QUE CE QUE L'ON DÉTIENT (`capacitesDelegables`).
 *   3. ON N'INVITE QUE SUR SON PROPRE PÉRIMÈTRE (`peutPiloterService`).
 *
 * La délégation se propage donc de proche en proche — un coordinateur peut
 * inviter dans le service qu'on lui a confié — mais elle ne peut jamais en
 * sortir : le périmètre d'un invité est toujours inclus dans celui de son
 * invitant.
 */

/** Le rôle applicatif se déduit du niveau : on ne demande pas les deux. */
const ROLE_PAR_NIVEAU: Record<NiveauResponsabilite, AccountRole> = {
  [NiveauResponsabilite.DIRECTION]: AccountRole.ADMIN,
  [NiveauResponsabilite.RESPONSABLE]: AccountRole.MANAGER,
  [NiveauResponsabilite.SALARIE]: AccountRole.MEMBER,
};

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  private ttlMs(): number {
    const days = this.config.get<number>('INVITATION_TTL_DAYS') ?? 7;
    return days * 24 * 60 * 60 * 1000;
  }

  /** Le rattachement de l'invitant, tel que le périmètre le décrit. */
  private async membreCourant(account: RequestAccount, user: RequestUser): Promise<MembreCourant> {
    const brut = await this.prisma.membership.findFirst({
      where: { userId: user.id, accountId: account.id },
      select: SELECT_MEMBRE,
    });
    if (!brut) throw new ForbiddenException("Vous n'êtes pas membre de ce compte.");
    return versMembreCourant(brut);
  }

  /** Qui a le droit d'inviter : la capacité, pas le rôle applicatif. */
  private assertPeutInviter(membre: MembreCourant) {
    if (!capacitesEffectives(membre).includes(Capacite.INVITER_MEMBRES)) {
      throw new ForbiddenException(
        "Vous n'avez pas le droit d'inviter des personnes dans cet établissement. " +
          'Un responsable ou la direction peut vous l’accorder.',
      );
    }
  }

  /** Crée une invitation pour le compte actif. */
  async create(account: RequestAccount, inviter: RequestUser, dto: CreateInvitationDto) {
    const email = dto.email.trim().toLowerCase();
    const membre = await this.membreCourant(account, inviter);
    this.assertPeutInviter(membre);

    // --- Règle 1 : on n'invite jamais plus haut que soi. ---
    const niveau = niveauDelegable(membre, dto.niveau ?? NiveauResponsabilite.SALARIE);

    // --- Règle 2 : on ne délègue que ce que l'on détient. ---
    const capacites = capacitesDelegables(membre, dto.capacites ?? []);

    // --- Règle 3 : on n'invite que sur son propre périmètre. ---
    const services = this.servicesAutorises(membre, dto);
    // Le service principal suit le premier rattachement demandé.
    const orgUnitId =
      services.find((s) => s.portee === PorteeService.RATTACHEMENT)?.orgUnitId ?? null;

    await this.assertServicesDuCompte(account, services.map((s) => s.orgUnitId));

    // Déjà membre ? (via User -> Membership sur ce compte)
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingUser) {
      const alreadyMember = await this.prisma.membership.findUnique({
        where: { userId_accountId: { userId: existingUser.id, accountId: account.id } },
      });
      if (alreadyMember) {
        throw new ConflictException('Cette personne est déjà membre du compte.');
      }
    }

    // Invitation en attente déjà existante ? (contrainte unique [email, accountId])
    const existingInvite = await this.prisma.invitation.findUnique({
      where: { email_accountId: { email, accountId: account.id } },
    });
    if (existingInvite && existingInvite.status === InvitationStatus.PENDING) {
      throw new ConflictException('Une invitation est déjà en attente pour cet email.');
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + this.ttlMs());
    const role = dto.role ?? ROLE_PAR_NIVEAU[niveau];

    const invitation = await this.prisma.$transaction(async (tx) => {
      const ligne = existingInvite
        ? await tx.invitation.update({
            where: { id: existingInvite.id },
            data: {
              role,
              niveau,
              capacites,
              message: dto.message ?? null,
              orgUnitId,
              token,
              status: InvitationStatus.PENDING,
              invitedById: inviter.id,
              expiresAt,
              acceptedAt: null,
            },
          })
        : await tx.invitation.create({
            data: {
              email,
              accountId: account.id,
              role,
              niveau,
              capacites,
              message: dto.message ?? null,
              orgUnitId,
              token,
              invitedById: inviter.id,
              expiresAt,
            },
          });

      // Les services portés par l'invitation sont réécrits en entier : une
      // invitation renvoyée avec d'autres services ne doit pas cumuler les
      // anciens, sinon on élargit un périmètre sans le vouloir.
      await tx.invitationService.deleteMany({ where: { invitationId: ligne.id } });
      if (services.length > 0) {
        await tx.invitationService.createMany({
          data: services.map((s) => ({
            invitationId: ligne.id,
            orgUnitId: s.orgUnitId,
            portee: s.portee,
          })),
          skipDuplicates: true,
        });
      }
      return ligne;
    });

    const acc = await this.prisma.account.findUniqueOrThrow({
      where: { id: account.id },
      select: { name: true },
    });
    await this.mail.sendInvitation(email, token, acc.name);

    return this.sanitize(invitation);
  }

  /**
   * Les services que l'invitant a le droit de confier, filtrés à son périmètre.
   *
   * Une Direction validée pilote tout l'établissement. Un responsable ne peut
   * confier QUE les services qu'il encadre — c'est ce qui empêche la
   * délégation de sortir du périmètre de celui qui la donne.
   */
  private servicesAutorises(
    membre: MembreCourant,
    dto: CreateInvitationDto,
  ): { orgUnitId: string; portee: PorteeService }[] {
    const demandes: { orgUnitId: string; portee: PorteeService }[] = [
      ...(dto.services ?? []),
    ];
    if (dto.orgUnitId && !demandes.some((s) => s.orgUnitId === dto.orgUnitId)) {
      demandes.push({ orgUnitId: dto.orgUnitId, portee: PorteeService.RATTACHEMENT });
    }

    const refuses = demandes.filter((s) => !peutPiloterService(membre, s.orgUnitId));
    if (refuses.length > 0 && !estDirection(membre)) {
      throw new ForbiddenException(
        'Vous ne pouvez inviter que dans les services que vous encadrez.',
      );
    }
    return demandes;
  }

  /** Un service invité doit appartenir à CET établissement. */
  private async assertServicesDuCompte(account: RequestAccount, ids: string[]) {
    if (ids.length === 0) return;
    const uniques = Array.from(new Set(ids));
    const trouves = await this.prisma.orgUnit.count({
      where: { id: { in: uniques }, accountId: account.id },
    });
    if (trouves !== uniques.length) {
      throw new NotFoundException("Un des services indiqués n'existe pas dans cet établissement.");
    }
  }

  /** Liste les invitations du compte actif, bornées au périmètre de qui demande. */
  async list(account: RequestAccount, user: RequestUser) {
    const membre = await this.membreCourant(account, user);
    const invites = await this.prisma.invitation.findMany({
      where: {
        accountId: account.id,
        // Une Direction validée voit toutes les invitations en cours. Les
        // autres ne voient que celles qu'ils ont eux-mêmes envoyées : c'est la
        // même règle que pour les personnes.
        ...(estDirection(membre) ? {} : { invitedById: user.id }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        orgUnit: { select: { id: true, name: true } },
        services: { include: { orgUnit: { select: { id: true, name: true } } } },
        invitedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    return invites.map((i) => this.sanitize(i));
  }

  private async loadInAccount(account: RequestAccount, invitationId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
    });
    if (!invitation || invitation.accountId !== account.id) {
      throw new NotFoundException('Invitation introuvable pour ce compte.');
    }
    return invitation;
  }

  /** On ne révoque ni ne renvoie l'invitation d'un autre, sauf en Direction. */
  private async assertPeutAgirSur(
    account: RequestAccount,
    user: RequestUser,
    invitationId: string,
  ) {
    const invitation = await this.loadInAccount(account, invitationId);
    const membre = await this.membreCourant(account, user);
    if (invitation.invitedById !== user.id && !estDirection(membre)) {
      throw new ForbiddenException(
        "Cette invitation a été envoyée par quelqu'un d'autre.",
      );
    }
    return invitation;
  }

  async revoke(account: RequestAccount, user: RequestUser, invitationId: string) {
    const invitation = await this.assertPeutAgirSur(account, user, invitationId);
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Seule une invitation en attente peut être révoquée.');
    }
    const updated = await this.prisma.invitation.update({
      where: { id: invitationId },
      data: { status: InvitationStatus.REVOKED },
    });
    return this.sanitize(updated);
  }

  /**
   * Renvoie une invitation restée en attente : nouveau jeton, nouvelle
   * échéance, et le mail repart. L'ancien jeton cesse aussitôt de fonctionner,
   * pour qu'un lien qui aurait traîné dans une boîte mail ne serve plus.
   */
  async resend(account: RequestAccount, user: RequestUser, invitationId: string) {
    const invitation = await this.assertPeutAgirSur(account, user, invitationId);
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Seule une invitation en attente peut être renvoyée.');
    }
    const token = randomUUID();
    const updated = await this.prisma.invitation.update({
      where: { id: invitationId },
      data: { token, expiresAt: new Date(Date.now() + this.ttlMs()) },
    });
    const acc = await this.prisma.account.findUniqueOrThrow({
      where: { id: account.id },
      select: { name: true },
    });
    await this.mail.sendInvitation(invitation.email, token, acc.name);
    return this.sanitize(updated);
  }

  /**
   * L'INVITATION, VUE PAR LA PERSONNE INVITÉE, AVANT D'ACCEPTER.
   *
   * ⚠ C'est ici que se donne le consentement, et il doit être éclairé : accepter
   * une invitation fait entrer ses demandes et ses inscriptions dans le champ de
   * vision de celui qui invite. La personne doit donc lire, AVANT de cliquer,
   * qui verra quoi. Une mention dans des CGU ne vaut rien à côté de cette
   * phrase-là, affichée au bon moment.
   *
   * Route publique (jeton en main) : elle n'expose que l'établissement, le
   * service, le niveau, l'invitant et ce que cela implique. Jamais la liste des
   * membres, jamais autre chose.
   */
  async apercu(token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: {
        account: { select: { id: true, name: true, city: true, structure: { select: { nom: true } } } },
        orgUnit: { select: { id: true, name: true } },
        services: { include: { orgUnit: { select: { id: true, name: true } } } },
        invitedBy: { select: { firstName: true, lastName: true } },
      },
    });
    if (!invitation) throw new NotFoundException('Invitation introuvable.');

    const expiree =
      invitation.status !== InvitationStatus.PENDING ||
      invitation.expiresAt.getTime() < Date.now();

    const invitantNom = [invitation.invitedBy?.firstName, invitation.invitedBy?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    return {
      email: invitation.email,
      etablissement: invitation.account.name,
      ville: invitation.account.city,
      structure: invitation.account.structure?.nom ?? null,
      niveau: invitation.niveau,
      capacites: invitation.capacites,
      message: invitation.message,
      invitant: invitantNom || null,
      services: invitation.services.map((s) => ({
        id: s.orgUnit.id,
        nom: s.orgUnit.name,
        portee: s.portee,
      })),
      expiree,
      /**
       * La phrase de consentement, écrite côté serveur pour qu'elle dise la
       * vérité de ce que l'acceptation produit — et non ce qu'un écran aurait
       * recopié un jour puis oublié de mettre à jour.
       */
      consentement: this.phraseConsentement(invitantNom, invitation.services.map((s) => s.orgUnit.name)),
    };
  }

  private phraseConsentement(invitant: string | null, services: string[]): string {
    const qui = invitant ? invitant : 'la personne qui vous invite';
    const ou =
      services.length === 0
        ? 'cet établissement'
        : services.length === 1
          ? `le service ${services[0]}`
          : `les services ${services.join(', ')}`;
    return (
      `En rejoignant ${ou}, ${qui} verra vos demandes de devis, vos réservations ` +
      `et vos inscriptions faites au nom de l’établissement. Vos données personnelles ` +
      `et vos échanges privés restent les vôtres. Vous pouvez quitter ce service à tout moment.`
    );
  }

  /**
   * Accepte une invitation : crée le Membership. L'utilisateur DOIT être
   * authentifié et son email doit correspondre à celui invité (anti-hijack).
   *
   * C'est ici que naît le lien de parrainage — donc la visibilité. Et c'est ici
   * que le rattachement devient VÉRIFIÉ : quelqu'un a attesté que cette
   * personne appartient bien à ce service. ⚠ Cela ne valide PAS son titre :
   * `niveauValide` ne passe à vrai que si l'invitant pouvait le donner
   * (`niveauValideDOffice`). Un collègue qui invite quelqu'un ne le nomme pas
   * directeur.
   */
  async accept(user: RequestUser, token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: { services: true },
    });
    if (!invitation) {
      throw new NotFoundException('Invitation introuvable.');
    }
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Cette invitation n\'est plus valide.');
    }
    if (invitation.expiresAt.getTime() < Date.now()) {
      await this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.EXPIRED },
      });
      throw new BadRequestException('Cette invitation a expiré.');
    }
    if (user.email.trim().toLowerCase() !== invitation.email.trim().toLowerCase()) {
      throw new ForbiddenException(
        'Cette invitation est destinée à une autre adresse email.',
      );
    }

    // Le rattachement de l'invitant : c'est lui qui portera le parrainage.
    const invitantMembre = await this.prisma.membership.findFirst({
      where: { userId: invitation.invitedById, accountId: invitation.accountId },
      select: SELECT_MEMBRE,
    });
    const niveauValide = invitantMembre
      ? niveauValideDOffice(versMembreCourant(invitantMembre), invitation.niveau)
      : invitation.niveau !== NiveauResponsabilite.DIRECTION;

    const membership = await this.prisma.$transaction(async (tx) => {
      const created = await tx.membership.upsert({
        where: {
          userId_accountId: { userId: user.id, accountId: invitation.accountId },
        },
        create: {
          userId: user.id,
          accountId: invitation.accountId,
          role: invitation.role,
          // Le service choisi à l'invitation suit jusqu'au rattachement : la
          // personne apparaît dans le planning de son équipe dès son arrivée,
          // sans qu'un responsable ait à y penser.
          orgUnitId: invitation.orgUnitId,
          status: MembershipStatus.ACTIVE,
          niveau: invitation.niveau,
          niveauValide,
          capacites: invitation.capacites,
          verifie: true,
          origineVerification: OrigineVerification.INVITATION,
          verifieParId: invitation.invitedById,
          verifieLe: new Date(),
          parrainMembershipId: invitantMembre?.id ?? null,
        },
        update: {
          // Réactive un accès précédemment suspendu et applique le rôle invité.
          role: invitation.role,
          // On ne défait pas un rattachement existant si l'invitation n'en
          // précisait aucun : réactiver un accès n'est pas repartir de zéro.
          ...(invitation.orgUnitId ? { orgUnitId: invitation.orgUnitId } : {}),
          status: MembershipStatus.ACTIVE,
          verifie: true,
          origineVerification: OrigineVerification.INVITATION,
          verifieParId: invitation.invitedById,
          verifieLe: new Date(),
        },
      });

      if (invitation.services.length > 0) {
        await tx.membershipService.createMany({
          data: invitation.services.map((s) => ({
            membershipId: created.id,
            orgUnitId: s.orgUnitId,
            portee: s.portee,
          })),
          skipDuplicates: true,
        });
      } else if (invitation.orgUnitId) {
        await tx.membershipService.createMany({
          data: [
            {
              membershipId: created.id,
              orgUnitId: invitation.orgUnitId,
              portee: PorteeService.RATTACHEMENT,
            },
          ],
          skipDuplicates: true,
        });
      }

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.ACCEPTED, acceptedAt: new Date() },
      });

      return created;
    });

    return {
      accepted: true,
      membership: {
        id: membership.id,
        accountId: membership.accountId,
        role: membership.role,
        niveau: membership.niveau,
        niveauValide: membership.niveauValide,
      },
    };
  }

  /** Ne jamais exposer le token dans les listes/retours d'administration. */
  private sanitize<T extends { token: string }>(invitation: T): Omit<T, 'token'> {
    const { token: _token, ...rest } = invitation;
    return rest;
  }
}
