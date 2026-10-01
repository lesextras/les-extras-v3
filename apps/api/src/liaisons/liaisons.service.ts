import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AccountType, MembershipStatus, StatutLiaison } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestAccount } from '../common/types/request-context';
import {
  TYPES_RELIABLES,
  estAdmin,
  sensDuLien,
  statutALaDemande,
  typeOppose,
  verifierReponse,
  verifierRetrait,
  type Perimetre,
} from './liaisons';

/** Un espace Pilote vu par les liaisons : une association (organisation) ou une académie. */
export interface EspaceRelie {
  accountId: string;
  type: AccountType;
  nom: string;
  organisationId: string | null;
  academieId: string | null;
}

export interface EspaceResume {
  id: string;
  nom: string;
  accountId: string;
}

/**
 * LES LIENS ENTRE ESPACES (Réglages → « Espaces reliés »).
 *
 * Un lien relie UNE association et UNE académie. Tant qu'il n'est pas ACTIVE,
 * il n'ouvre rien : les périmètres ci-dessous ne lisent que les liens actifs.
 */
@Injectable()
export class LiaisonsService {
  constructor(private readonly prisma: PrismaService) {}

  /** L'espace d'un compte ; la fiche (organisation ou académie) est posée si elle manque. */
  async espaceDe(accountId: string): Promise<EspaceRelie> {
    const compte = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { id: true, type: true, name: true, organisation: { select: { id: true, nom: true } }, academie: { select: { id: true, nom: true } } },
    });
    if (!compte) throw new NotFoundException('Cet espace est introuvable.');
    if (!TYPES_RELIABLES.has(compte.type)) throw new BadRequestException('Seuls une association et une académie peuvent être reliées.');
    if (compte.type === AccountType.ASSOCIATION) {
      const o = compte.organisation ?? (await this.prisma.organisation.create({ data: { accountId: compte.id, nom: compte.name }, select: { id: true, nom: true } }));
      return { accountId: compte.id, type: compte.type, nom: o.nom, organisationId: o.id, academieId: null };
    }
    const a = compte.academie ?? (await this.prisma.academie.create({ data: { accountId: compte.id, nom: compte.name }, select: { id: true, nom: true } }));
    return { accountId: compte.id, type: compte.type, nom: a.nom, organisationId: null, academieId: a.id };
  }

  /** Les liens du compte courant, et les espaces que la personne peut y relier. */
  async liste(account: RequestAccount, userId: string) {
    const ici = await this.espaceDe(account.id);
    const liens = await this.prisma.liaisonEspace.findMany({
      where: ici.organisationId ? { organisationId: ici.organisationId } : { academieId: ici.academieId as string },
      include: {
        organisation: { select: { nom: true, accountId: true } },
        academie: { select: { nom: true, accountId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const oppose = typeOppose(ici.type);
    const adhesions = await this.prisma.membership.findMany({
      where: { userId, status: MembershipStatus.ACTIVE, account: { type: oppose } },
      select: { role: true, account: { select: { id: true, name: true } } },
    });
    const affiches = liens.map((l) => {
      const autre = ici.organisationId ? l.academie : l.organisation;
      return {
        id: l.id,
        statut: l.statut,
        sens: sensDuLien(l, account.id),
        autre: { type: oppose, nom: autre.nom, accountId: autre.accountId },
        createdAt: l.createdAt,
        accepteeLe: l.accepteeLe,
      };
    });
    const dejaRelies = new Set(affiches.filter((l) => l.statut !== StatutLiaison.REFUSEE).map((l) => l.autre.accountId));
    return {
      espace: { type: ici.type, nom: ici.nom },
      peutGerer: estAdmin(account.role),
      liens: affiches,
      reliables: adhesions
        .filter((m) => !dejaRelies.has(m.account.id))
        .map((m) => ({ accountId: m.account.id, nom: m.account.name, type: oppose, jeSuisAdmin: estAdmin(m.role) })),
    };
  }

  /**
   * Relier le compte courant à un autre espace dont la personne est membre.
   * Actif d'emblée si elle administre les deux ; sinon en attente de l'autre.
   */
  async demander(account: RequestAccount, userId: string, autreAccountId: string) {
    const ici = await this.espaceDe(account.id);
    const oppose = typeOppose(ici.type);
    if (autreAccountId === account.id) throw new BadRequestException('Un espace ne se relie pas à lui-même.');
    const adhesion = await this.prisma.membership.findUnique({
      where: { userId_accountId: { userId, accountId: autreAccountId } },
      select: { role: true, status: true, account: { select: { type: true } } },
    });
    // On ne révèle rien d'un espace dont la personne n'est pas membre.
    if (!adhesion || adhesion.status !== MembershipStatus.ACTIVE || adhesion.account.type !== oppose) {
      throw new NotFoundException('Cet espace est introuvable.');
    }
    const laBas = await this.espaceDe(autreAccountId);
    const organisationId = (ici.organisationId ?? laBas.organisationId) as string;
    const academieId = (ici.academieId ?? laBas.academieId) as string;
    const existante = await this.prisma.liaisonEspace.findUnique({ where: { organisationId_academieId: { organisationId, academieId } } });
    const statut = statutALaDemande(account.id, estAdmin(account.role), estAdmin(adhesion.role), existante);
    if (statut === null) return { id: existante!.id, statut: existante!.statut };
    const accepteeLe = statut === StatutLiaison.ACTIVE ? new Date() : null;
    // Demander à son tour un lien que l'autre a demandé, c'est l'accepter : la demande reste la sienne.
    const reponseALautre = existante?.statut === StatutLiaison.EN_ATTENTE && existante.demandeDepuisAccountId !== account.id;
    const lien = existante
      ? await this.prisma.liaisonEspace.update({
          where: { id: existante.id },
          data: reponseALautre ? { statut, accepteeLe } : { statut, accepteeLe, demandeDepuisAccountId: account.id, demandeParUserId: userId },
        })
      : await this.prisma.liaisonEspace.create({
          data: { organisationId, academieId, statut, accepteeLe, demandeDepuisAccountId: account.id, demandeParUserId: userId },
        });
    return { id: lien.id, statut: lien.statut };
  }

  async repondre(account: RequestAccount, id: string, accepter: boolean) {
    const lien = await this.lienDe(account.id, id);
    verifierReponse(lien, account.id, account.role);
    const maj = await this.prisma.liaisonEspace.update({
      where: { id },
      data: accepter ? { statut: StatutLiaison.ACTIVE, accepteeLe: new Date() } : { statut: StatutLiaison.REFUSEE, accepteeLe: null },
    });
    return { id: maj.id, statut: maj.statut };
  }

  /** Retirer le lien. Les liens projets ↔ formations entre les deux espaces partent avec lui. */
  async retirer(account: RequestAccount, id: string) {
    const lien = await this.lienDe(account.id, id);
    verifierRetrait(account.role);
    await this.prisma.$transaction([
      this.prisma.projetFormation.deleteMany({ where: { academieId: lien.academieId, action: { organisationId: lien.organisationId } } }),
      this.prisma.liaisonEspace.delete({ where: { id } }),
    ]);
    return { ok: true };
  }

  /* --------------------------------------------------------- périmètres */

  /**
   * Une académie voit ses propres projets ET ceux des associations reliées
   * par un lien ACTIVE ; ses membres et ceux de ces associations peuvent
   * porter une tâche.
   */
  async perimetreAcademie(accountId: string): Promise<{ perimetre: Perimetre; academie: EspaceResume; associations: EspaceResume[] }> {
    const ici = await this.espaceDe(accountId);
    if (ici.type !== AccountType.ACADEMIE || !ici.academieId) throw new ForbiddenException("Cet espace est réservé aux comptes de type académie.");
    const liens = await this.prisma.liaisonEspace.findMany({
      where: { academieId: ici.academieId, statut: StatutLiaison.ACTIVE },
      select: { organisation: { select: { id: true, nom: true, accountId: true } } },
      orderBy: { createdAt: 'asc' },
    });
    const associations = liens.map((l) => l.organisation);
    return {
      perimetre: {
        accountId,
        organisationIds: associations.map((a) => a.id),
        academieIds: [ici.academieId],
        comptes: [accountId, ...associations.map((a) => a.accountId)],
      },
      academie: { id: ici.academieId, nom: ici.nom, accountId },
      associations,
    };
  }

  /** Une association voit ses projets ; elle lit le catalogue des académies reliées (lien ACTIVE). */
  async perimetreAssociation(accountId: string): Promise<{ perimetre: Perimetre; organisation: EspaceResume; academies: EspaceResume[] }> {
    const ici = await this.espaceDe(accountId);
    if (ici.type !== AccountType.ASSOCIATION || !ici.organisationId) throw new ForbiddenException("Ce compte n'est pas un compte d'association.");
    const liens = await this.prisma.liaisonEspace.findMany({
      where: { organisationId: ici.organisationId, statut: StatutLiaison.ACTIVE },
      select: { academie: { select: { id: true, nom: true, accountId: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return {
      perimetre: { accountId, organisationIds: [ici.organisationId], academieIds: [], comptes: [accountId] },
      organisation: { id: ici.organisationId, nom: ici.nom, accountId },
      academies: liens.map((l) => l.academie),
    };
  }

  /** Un lien qui concerne le compte courant ; sinon introuvable. */
  private async lienDe(accountId: string, id: string) {
    const ici = await this.espaceDe(accountId);
    const lien = await this.prisma.liaisonEspace.findFirst({
      where: { id, ...(ici.organisationId ? { organisationId: ici.organisationId } : { academieId: ici.academieId as string }) },
    });
    if (!lien) throw new NotFoundException('Ce lien est introuvable.');
    return lien;
  }
}
