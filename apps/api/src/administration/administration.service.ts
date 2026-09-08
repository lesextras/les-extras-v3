import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AccountType, GlobalRole, Prisma, StatutVente, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { ChercherDto, ModifierCompteDto, ModifierPersonneDto } from './dto/administration.dto';

/**
 * L'ADMINISTRATION DE PILOTER.
 *
 * Ce que l'administration voit : tous les espaces, toutes les personnes, tout
 * ce qui a été créé. Ce qu'elle peut faire : corriger une fiche, donner ou
 * retirer l'accès à quelqu'un, suspendre un compte.
 *
 * Ce qu'elle NE FAIT PAS : supprimer. Rien ici n'efface une donnée d'un espace
 * — ni un formulaire, ni un cours, ni une association. Suspendre se défait ;
 * supprimer, non.
 */
@Injectable()
export class AdministrationService {
  constructor(private readonly prisma: PrismaService) {}

  /* ==================================================== LE TABLEAU DE BORD */

  async tableau() {
    const [
      comptes,
      personnes,
      organisations,
      academies,
      formulaires,
      reponses,
      cours,
      apprenants,
      ventes,
      derniersComptes,
      dernieresPersonnes,
    ] = await Promise.all([
      this.prisma.account.groupBy({ by: ['type'], _count: { _all: true } }),
      this.prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
      this.prisma.organisation.count(),
      this.prisma.academie.count(),
      this.prisma.formulaire.count(),
      this.prisma.reponseFormulaire.count(),
      this.prisma.cours.count(),
      this.prisma.inscriptionCours.count(),
      this.prisma.venteCours.aggregate({ where: { statut: StatutVente.PAYEE }, _sum: { montantCents: true }, _count: { _all: true } }),
      this.prisma.account.findMany({
        where: { type: { in: [AccountType.ASSOCIATION, AccountType.ACADEMIE] } },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: { id: true, name: true, type: true, slug: true, createdAt: true, owner: { select: { email: true } } },
      }),
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: { id: true, email: true, firstName: true, lastName: true, role: true, status: true, createdAt: true },
      }),
    ]);

    const parType = (t: AccountType) => comptes.find((c) => c.type === t)?._count._all ?? 0;

    return {
      comptes: {
        total: comptes.reduce((n, c) => n + c._count._all, 0),
        associations: parType(AccountType.ASSOCIATION),
        academies: parType(AccountType.ACADEMIE),
        etablissements: parType(AccountType.ESTABLISHMENT),
        intervenants: parType(AccountType.FREELANCE),
      },
      personnes: {
        total: personnes.reduce((n, p) => n + p._count._all, 0),
        administration: personnes.find((p) => p.role === GlobalRole.ADMIN)?._count._all ?? 0,
      },
      fiches: { organisations, academies },
      formulaires: { total: formulaires, reponses },
      ecole: { cours, apprenants, ventes: ventes._count._all, chiffreCents: ventes._sum.montantCents ?? 0 },
      derniersComptes: derniersComptes.map((c) => ({
        id: c.id,
        nom: c.name,
        type: c.type,
        slug: c.slug,
        courriel: c.owner?.email ?? null,
        creeLe: c.createdAt,
      })),
      dernieresPersonnes: dernieresPersonnes.map((p) => ({
        id: p.id,
        email: p.email,
        nom: [p.firstName, p.lastName].filter(Boolean).join(' ') || null,
        role: p.role,
        statut: p.status,
        creeLe: p.createdAt,
      })),
    };
  }

  /* ========================================================== LES ESPACES */

  async comptes(dto: ChercherDto) {
    const q = dto.q?.trim();
    const where: Prisma.AccountWhereInput = {
      ...(dto.type ? { type: dto.type } : { type: { in: [AccountType.ASSOCIATION, AccountType.ACADEMIE] } }),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { slug: { contains: q, mode: 'insensitive' } },
              { owner: { email: { contains: q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const comptes = await this.prisma.account.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 300,
      select: {
        id: true,
        name: true,
        type: true,
        slug: true,
        city: true,
        siret: true,
        createdAt: true,
        owner: { select: { id: true, email: true, status: true } },
        organisation: { select: { nom: true, rna: true, siret: true } },
        academie: { select: { nom: true, nda: true, qualiopi: true } },
        _count: { select: { formulaires: true, cours: true, memberships: true } },
      },
    });

    return comptes.map((c) => ({
      id: c.id,
      nom: c.name,
      type: c.type,
      slug: c.slug,
      commune: c.city,
      siret: c.siret,
      creeLe: c.createdAt,
      proprietaire: c.owner ? { id: c.owner.id, email: c.owner.email, statut: c.owner.status } : null,
      association: c.organisation ? { nom: c.organisation.nom, rna: c.organisation.rna, siret: c.organisation.siret } : null,
      academie: c.academie ? { nom: c.academie.nom, nda: c.academie.nda, qualiopi: c.academie.qualiopi } : null,
      nbFormulaires: c._count.formulaires,
      nbCours: c._count.cours,
      nbMembres: c._count.memberships,
    }));
  }

  async compte(id: string) {
    const c = await this.prisma.account.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        legalName: true,
        type: true,
        slug: true,
        siret: true,
        address: true,
        postalCode: true,
        city: true,
        phone: true,
        source: true,
        createdAt: true,
        owner: { select: { id: true, email: true, firstName: true, lastName: true, role: true, status: true } },
        organisation: true,
        academie: true,
        formulaires: {
          orderBy: { updatedAt: 'desc' },
          take: 50,
          select: { id: true, titre: true, slug: true, statut: true, updatedAt: true, _count: { select: { reponses: true } } },
        },
        cours: {
          orderBy: { updatedAt: 'desc' },
          take: 50,
          select: { id: true, titre: true, slug: true, statut: true, updatedAt: true, _count: { select: { inscriptions: true } } },
        },
        memberships: {
          take: 50,
          select: { id: true, role: true, status: true, user: { select: { id: true, email: true } } },
        },
      },
    });
    if (!c) throw new NotFoundException("Cet espace n'existe pas.");

    return {
      ...c,
      formulaires: c.formulaires.map((f) => ({ ...f, nbReponses: f._count.reponses })),
      cours: c.cours.map((x) => ({ ...x, nbApprenants: x._count.inscriptions })),
    };
  }

  async modifierCompte(id: string, dto: ModifierCompteDto) {
    const c = await this.prisma.account.findUnique({ where: { id }, select: { id: true } });
    if (!c) throw new NotFoundException("Cet espace n'existe pas.");
    return this.prisma.account.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.legalName !== undefined ? { legalName: dto.legalName.trim() || null } : {}),
        ...(dto.siret !== undefined ? { siret: dto.siret.replace(/\s/g, '') || null } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone.trim() || null } : {}),
        ...(dto.city !== undefined ? { city: dto.city.trim() || null } : {}),
      },
      select: { id: true, name: true, legalName: true, siret: true, phone: true, city: true },
    });
  }

  /* ======================================================== LES PERSONNES */

  async personnes(dto: ChercherDto) {
    const q = dto.q?.trim();
    const personnes = await this.prisma.user.findMany({
      where: q
        ? {
            OR: [
              { email: { contains: q, mode: 'insensitive' } },
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {},
      orderBy: { createdAt: 'desc' },
      take: 300,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        ownedAccounts: { select: { id: true, name: true, type: true } },
      },
    });

    return personnes.map((p) => ({
      id: p.id,
      email: p.email,
      nom: [p.firstName, p.lastName].filter(Boolean).join(' ') || null,
      role: p.role,
      statut: p.status,
      courrielVerifie: p.emailVerified,
      derniereConnexion: p.lastLoginAt,
      creeLe: p.createdAt,
      espaces: p.ownedAccounts.map((a) => ({ id: a.id, nom: a.name, type: a.type })),
    }));
  }

  async modifierPersonne(id: string, dto: ModifierPersonneDto, moi: string) {
    const p = await this.prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!p) throw new NotFoundException("Cette personne n'existe pas.");

    if (id === moi && (dto.role === GlobalRole.USER || dto.status === UserStatus.BANNED)) {
      throw new BadRequestException("On ne se retire pas soi-même l'accès : demande à une autre personne de l'administration.");
    }
    if (dto.status === UserStatus.ANONYMIZED) {
      throw new BadRequestException("L'anonymisation passe par la demande d'effacement, pas par cet écran.");
    }

    const maj = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.role !== undefined ? { role: dto.role } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
      select: { id: true, email: true, role: true, status: true },
    });
    return maj;
  }

  /* ======================================================= CE QUI SE PASSE */

  /** Les formulaires de tous les espaces, du plus récemment modifié. */
  async formulaires() {
    const liste = await this.prisma.formulaire.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 200,
      select: {
        id: true,
        titre: true,
        slug: true,
        statut: true,
        updatedAt: true,
        account: { select: { id: true, name: true, type: true } },
        _count: { select: { reponses: true } },
      },
    });
    return liste.map((f) => ({
      id: f.id,
      titre: f.titre,
      slug: f.slug,
      statut: f.statut,
      modifieLe: f.updatedAt,
      espace: f.account ? { id: f.account.id, nom: f.account.name, type: f.account.type } : null,
      nbReponses: f._count.reponses,
    }));
  }

  /** Les cours en ligne de tous les espaces. */
  async cours() {
    const liste = await this.prisma.cours.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 200,
      select: {
        id: true,
        titre: true,
        slug: true,
        statut: true,
        gratuit: true,
        prixCents: true,
        updatedAt: true,
        account: { select: { id: true, name: true, type: true } },
        _count: { select: { inscriptions: true } },
      },
    });
    return liste.map((c) => ({
      id: c.id,
      titre: c.titre,
      slug: c.slug,
      statut: c.statut,
      gratuit: c.gratuit,
      prixCents: c.prixCents,
      modifieLe: c.updatedAt,
      espace: c.account ? { id: c.account.id, nom: c.account.name, type: c.account.type } : null,
      nbApprenants: c._count.inscriptions,
    }));
  }
}
