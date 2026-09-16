import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MotifDemandeService, PorteeService, StatutDemande } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RequestAccount, RequestUser } from '../common/types/request-context';
import { normaliserNom } from '../common/normaliser';
import {
  SELECT_MEMBRE,
  versMembreCourant,
  estDirection,
  peutPiloterService,
} from '../common/perimetre';
import {
  CreateUnitDto,
  UpdateUnitDto,
  AssignMemberDto,
  DemandeServiceDto,
  DeciderDemandeServiceDto,
} from './dto/unit.dto';

/**
 * Unités / services d'un établissement (repris de Symfony : Service/unités).
 * Toutes les opérations sont bornées au COMPTE ACTIF (isolation multi-tenant).
 *
 * UNICITÉ DU NOM (16/09/2026) — dans un même établissement il ne peut pas y
 * avoir deux services du même nom. La contrainte porte sur un nom NORMALISÉ
 * (voir `common/normaliser.ts`) : sans normalisation, « SESSAD », « Sessad » et
 * « S.E.S.S.A.D. » passeraient tous les trois et on n'aurait rien empêché.
 *
 * Le doublon n'est pas une erreur qu'on renvoie sèchement : c'est un carrefour.
 * Trois sorties sont offertes à la personne qui tombe dessus — rejoindre le
 * service existant (demande à celui qui l'a créé), préciser son propre nom
 * (« SESSAD Melun »), ou signaler aux Extras quand le service en place est
 * obsolète ou créé par quelqu'un qui est parti. Sans cette troisième sortie, un
 * service créé par erreur bloquerait son nom pour toujours.
 */
@Injectable()
export class UnitsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Liste les unités du compte actif + nombre de membres rattachés. */
  async list(account: RequestAccount, options: { inclureArchives?: boolean } = {}) {
    const units = await this.prisma.orgUnit.findMany({
      where: {
        accountId: account.id,
        ...(options.inclureArchives ? {} : { archiveLe: null }),
      },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { memberships: true, missions: true, membres: true } },
        creePar: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    return units.map((u) => ({
      id: u.id,
      name: u.name,
      description: u.description,
      // `membres` (MembershipService) est la source à jour ; `memberships`
      // reste renseigné pour l'existant, on prend le plus grand des deux plutôt
      // que d'afficher zéro sur un service dont personne n'a migré.
      memberCount: Math.max(u._count.membres, u._count.memberships),
      missionCount: u._count.missions,
      creePar: u.creePar,
      archiveLe: u.archiveLe,
      createdAt: u.createdAt,
    }));
  }

  /**
   * CONTRÔLE DE DOUBLON, appelé par le formulaire AVANT l'envoi.
   *
   * Renvoie le service qui porte déjà ce nom, s'il existe, avec de quoi
   * proposer les trois sorties. Ne crée rien, ne modifie rien.
   */
  async verifierNom(account: RequestAccount, nom: string) {
    const nomNormalise = normaliserNom(nom ?? '');
    if (!nomNormalise) {
      return { libre: false, motif: 'nom-vide' as const, existant: null };
    }
    const existant = await this.prisma.orgUnit.findUnique({
      where: { accountId_nomNormalise: { accountId: account.id, nomNormalise } },
      select: {
        id: true,
        name: true,
        description: true,
        archiveLe: true,
        createdAt: true,
        creePar: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { membres: true } },
      },
    });
    if (!existant) return { libre: true, motif: null, existant: null };
    return {
      libre: false,
      motif: 'doublon' as const,
      existant,
      /** Ce que la personne peut faire, dans l'ordre où on le lui propose. */
      sorties: ['REJOINDRE', 'PRECISER', 'SIGNALEMENT'] as const,
    };
  }

  async create(account: RequestAccount, user: RequestUser, dto: CreateUnitDto) {
    const nom = dto.name.trim();
    const nomNormalise = normaliserNom(nom);
    if (!nomNormalise) {
      throw new BadRequestException('Le nom du service doit contenir des lettres ou des chiffres.');
    }

    const existant = await this.prisma.orgUnit.findUnique({
      where: { accountId_nomNormalise: { accountId: account.id, nomNormalise } },
      select: { id: true, name: true, archiveLe: true },
    });
    if (existant) {
      // 409, pas 400 : c'est un conflit d'état, et le formulaire s'en sert pour
      // afficher le carrefour plutôt qu'un message d'erreur rouge.
      throw new ConflictException({
        message: `Un service « ${existant.name} » existe déjà dans cet établissement.`,
        code: 'SERVICE_DOUBLON',
        existant,
      });
    }

    return this.prisma.orgUnit.create({
      data: {
        accountId: account.id,
        name: nom,
        nomNormalise,
        description: dto.description,
        creeParId: user.id,
      },
    });
  }

  /** Charge une unité en garantissant qu'elle appartient au compte actif. */
  private async loadOwned(account: RequestAccount, id: string) {
    const unit = await this.prisma.orgUnit.findUnique({ where: { id } });
    if (!unit || unit.accountId !== account.id) {
      throw new NotFoundException('Unité introuvable.');
    }
    return unit;
  }

  async update(account: RequestAccount, id: string, dto: UpdateUnitDto) {
    await this.loadOwned(account, id);
    const data: { name?: string; nomNormalise?: string; description?: string } = {};

    if (dto.name !== undefined) {
      const nom = dto.name.trim();
      const nomNormalise = normaliserNom(nom);
      if (!nomNormalise) {
        throw new BadRequestException('Le nom du service doit contenir des lettres ou des chiffres.');
      }
      const autre = await this.prisma.orgUnit.findUnique({
        where: { accountId_nomNormalise: { accountId: account.id, nomNormalise } },
        select: { id: true, name: true },
      });
      if (autre && autre.id !== id) {
        throw new ConflictException({
          message: `Un service « ${autre.name} » existe déjà dans cet établissement.`,
          code: 'SERVICE_DOUBLON',
          existant: autre,
        });
      }
      data.name = nom;
      data.nomNormalise = nomNormalise;
    }
    if (dto.description !== undefined) data.description = dto.description;

    return this.prisma.orgUnit.update({ where: { id }, data });
  }

  /**
   * ARCHIVAGE, pas suppression.
   *
   * Un service porte des plannings, des missions et des rattachements : le
   * supprimer efface l'histoire de gens qui y ont travaillé. Il sort des listes
   * et ne se propose plus, c'est tout ce dont on a besoin. La suppression reste
   * possible tant que rien n'y est rattaché — un service créé par erreur il y a
   * trente secondes n'a pas à devenir une ligne d'archive.
   */
  async archiver(account: RequestAccount, id: string) {
    await this.loadOwned(account, id);
    const [membres, missions, shifts] = await Promise.all([
      this.prisma.membershipService.count({ where: { orgUnitId: id } }),
      this.prisma.reliefMission.count({ where: { orgUnitId: id } }),
      this.prisma.shift.count({ where: { orgUnitId: id } }),
    ]);

    if (membres === 0 && missions === 0 && shifts === 0) {
      await this.prisma.orgUnit.delete({ where: { id } });
      return { supprime: true, archive: false };
    }

    await this.prisma.orgUnit.update({
      where: { id },
      data: { archiveLe: new Date() },
    });
    return { supprime: false, archive: true };
  }

  async desarchiver(account: RequestAccount, id: string) {
    await this.loadOwned(account, id);
    return this.prisma.orgUnit.update({ where: { id }, data: { archiveLe: null } });
  }

  /**
   * Rattache (ou détache si unitId absent) un membre à une unité.
   * Le membership ET l'unité doivent appartenir au compte actif.
   *
   * Écrit les DEUX représentations : `Membership.orgUnitId` (service principal,
   * lu par tout l'existant — plannings, missions, invitations) et
   * `MembershipService` (rattachement multiple et encadrement). Les laisser
   * diverger ferait disparaître quelqu'un d'un planning sans que personne
   * comprenne pourquoi.
   */
  async assignMember(account: RequestAccount, dto: AssignMemberDto) {
    const membership = await this.prisma.membership.findUnique({
      where: { id: dto.membershipId },
    });
    if (!membership || membership.accountId !== account.id) {
      throw new NotFoundException('Membre introuvable.');
    }
    if (dto.unitId) {
      await this.loadOwned(account, dto.unitId);
    }

    const portee = dto.portee ?? PorteeService.RATTACHEMENT;

    return this.prisma.$transaction(async (tx) => {
      if (dto.unitId) {
        await tx.membershipService.upsert({
          where: {
            membershipId_orgUnitId_portee: {
              membershipId: dto.membershipId,
              orgUnitId: dto.unitId,
              portee,
            },
          },
          create: { membershipId: dto.membershipId, orgUnitId: dto.unitId, portee },
          update: {},
        });
      } else {
        // Détachement : on retire le rattachement principal seulement. Retirer
        // aussi les encadrements ferait perdre son périmètre à un chef de
        // service parce qu'on a changé son service d'affectation.
        await tx.membershipService.deleteMany({
          where: { membershipId: dto.membershipId, portee: PorteeService.RATTACHEMENT },
        });
      }

      // Le service principal ne suit que le rattachement, jamais l'encadrement.
      if (portee === PorteeService.RATTACHEMENT || !dto.unitId) {
        return tx.membership.update({
          where: { id: dto.membershipId },
          data: { orgUnitId: dto.unitId ?? null },
          select: { id: true, orgUnitId: true },
        });
      }
      return { id: dto.membershipId, orgUnitId: membership.orgUnitId };
    });
  }

  /** Retire une portée précise (utilisé pour retirer un encadrement). */
  async retirerService(account: RequestAccount, membershipId: string, orgUnitId: string, portee: PorteeService) {
    const membership = await this.prisma.membership.findUnique({ where: { id: membershipId } });
    if (!membership || membership.accountId !== account.id) {
      throw new NotFoundException('Membre introuvable.');
    }
    await this.prisma.membershipService.deleteMany({
      where: { membershipId, orgUnitId, portee },
    });
    if (portee === PorteeService.RATTACHEMENT && membership.orgUnitId === orgUnitId) {
      await this.prisma.membership.update({
        where: { id: membershipId },
        data: { orgUnitId: null },
      });
    }
    return { retire: true };
  }

  // -------------------------------------------------------------------------
  // DEMANDES PORTANT SUR UN SERVICE — les deux sorties du carrefour de doublon
  // -------------------------------------------------------------------------

  /**
   * REJOINDRE un service existant, ou le SIGNALER aux Extras.
   *
   * Rejoindre, c'est entrer dans le périmètre de quelqu'un : la demande part
   * vers celui qui a créé le service, et lui seul (ou la Direction) tranche.
   * C'est l'invitation dans l'autre sens, et le consentement est au même
   * endroit — chez celui qui tient le périmètre.
   */
  async demander(account: RequestAccount, user: RequestUser, dto: DemandeServiceDto) {
    const unit = await this.loadOwned(account, dto.orgUnitId);

    const dejaEnCours = await this.prisma.demandeService.findFirst({
      where: {
        orgUnitId: unit.id,
        demandeurId: user.id,
        motif: dto.motif,
        statut: StatutDemande.EN_ATTENTE,
      },
    });
    if (dejaEnCours) return dejaEnCours;

    return this.prisma.demandeService.create({
      data: {
        orgUnitId: unit.id,
        accountId: account.id,
        demandeurId: user.id,
        motif: dto.motif,
        message: dto.message,
      },
      include: {
        orgUnit: { select: { id: true, name: true } },
        demandeur: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  /** Les demandes que le membre courant a le droit de voir et de trancher. */
  async listerDemandes(account: RequestAccount, user: RequestUser) {
    const brut = await this.prisma.membership.findFirst({
      where: { userId: user.id, accountId: account.id },
      select: SELECT_MEMBRE,
    });
    if (!brut) throw new ForbiddenException("Vous n'êtes pas membre de ce compte.");
    const membre = versMembreCourant(brut);

    const demandes = await this.prisma.demandeService.findMany({
      where: {
        accountId: account.id,
        motif: MotifDemandeService.REJOINDRE,
        statut: StatutDemande.EN_ATTENTE,
      },
      include: {
        orgUnit: { select: { id: true, name: true, creeParId: true } },
        demandeur: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Une Direction validée voit tout. Les autres ne voient que les demandes
    // qui portent sur un service qu'ils pilotent ou qu'ils ont créé.
    if (estDirection(membre)) return demandes;
    return demandes.filter(
      (d) => peutPiloterService(membre, d.orgUnitId) || d.orgUnit.creeParId === user.id,
    );
  }

  /**
   * Accepter, c'est rattacher la personne au service — et donc la faire entrer
   * dans le périmètre de celui qui l'accepte. Le lien de parrainage est posé
   * dans la foulée : c'est lui qui porte la visibilité.
   */
  async deciderDemande(
    account: RequestAccount,
    user: RequestUser,
    id: string,
    dto: DeciderDemandeServiceDto,
  ) {
    const demande = await this.prisma.demandeService.findUnique({
      where: { id },
      include: { orgUnit: { select: { id: true, name: true, creeParId: true } } },
    });
    if (!demande || demande.accountId !== account.id) {
      throw new NotFoundException('Demande introuvable.');
    }
    if (demande.statut !== StatutDemande.EN_ATTENTE) {
      throw new BadRequestException('Cette demande a déjà été tranchée.');
    }

    const brut = await this.prisma.membership.findFirst({
      where: { userId: user.id, accountId: account.id },
      select: SELECT_MEMBRE,
    });
    if (!brut) throw new ForbiddenException("Vous n'êtes pas membre de ce compte.");
    const decideur = versMembreCourant(brut);

    const autorise =
      estDirection(decideur) ||
      peutPiloterService(decideur, demande.orgUnitId) ||
      demande.orgUnit.creeParId === user.id;
    if (!autorise) {
      throw new ForbiddenException(
        "Seul celui qui tient ce service — ou la direction de l'établissement — peut trancher cette demande.",
      );
    }

    if (!dto.accepter) {
      return this.prisma.demandeService.update({
        where: { id },
        data: { statut: StatutDemande.REFUSEE, decideParId: user.id, decideLe: new Date() },
      });
    }

    const membreDemandeur = await this.prisma.membership.findFirst({
      where: { userId: demande.demandeurId, accountId: account.id },
      select: { id: true, parrainMembershipId: true, verifie: true },
    });
    if (!membreDemandeur) {
      throw new BadRequestException(
        "Cette personne n'est plus rattachée à l'établissement.",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.membershipService.upsert({
        where: {
          membershipId_orgUnitId_portee: {
            membershipId: membreDemandeur.id,
            orgUnitId: demande.orgUnitId,
            portee: PorteeService.RATTACHEMENT,
          },
        },
        create: {
          membershipId: membreDemandeur.id,
          orgUnitId: demande.orgUnitId,
          portee: PorteeService.RATTACHEMENT,
        },
        update: {},
      });

      await tx.membership.update({
        where: { id: membreDemandeur.id },
        data: {
          // On ne réécrit pas un parrainage déjà posé : la première personne
          // qui a fait venir quelqu'un le garde dans son périmètre.
          parrainMembershipId: membreDemandeur.parrainMembershipId ?? decideur.id,
          verifie: true,
          origineVerification: 'RESPONSABLE',
          verifieParId: user.id,
          verifieLe: new Date(),
        },
      });

      return tx.demandeService.update({
        where: { id },
        data: { statut: StatutDemande.ACCEPTEE, decideParId: user.id, decideLe: new Date() },
      });
    });
  }
}
