import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  AccountRole,
  AccountType,
  EtatQualiopi,
  FormationStatus,
  InscriptionStatus,
  MembershipStatus,
  Prisma,
  ProofStatus,
  SessionStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RepertoiresFormationService, prerempliDepuis } from './repertoires';
import { ETAPES_ACADEMIE, VERSION_CHEMIN_ACADEMIE, trouverEtapeAcademie } from './chemin';
import type {
  ModifierAcademieDto,
  ModifierReclamationDto,
  ModifierVeilleDto,
  OuvrirAcademieDto,
  ReclamationDto,
  VeilleDto,
} from './dto/academie.dto';

/**
 * PILOTER MON ACADÉMIE — l'espace d'un organisme de formation.
 *
 * Le métier existe déjà ailleurs : `Formation`, `FormationSession`,
 * `Inscription`, `Emargement`, `QualiopiProof` sont en base depuis le centre
 * de formation. Ce service ne les duplique pas : il ouvre l'espace, tient la
 * fiche de l'organisme, le chemin, la veille et les réclamations, et compose
 * l'écran d'accueil à partir de tout ça.
 */
@Injectable()
export class AcademieService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repertoires: RepertoiresFormationService,
  ) {}

  // ------------------------------------------------------------- ouverture

  /**
   * Ouvrir l'espace d'une académie pour une personne déjà connectée. Sans le
   * drapeau `autre`, on lui rend celle qu'elle a déjà : repasser par
   * l'ouverture ne crée jamais un doublon par mégarde.
   */
  async ouvrir(userId: string, dto: OuvrirAcademieDto) {
    const siennes = await this.prisma.membership.findMany({
      where: { userId, status: MembershipStatus.ACTIVE, account: { type: AccountType.ACADEMIE } },
      select: { accountId: true, account: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    });
    if (siennes.length && !dto.autre) return { ok: true, accountId: siennes[0].accountId, existant: true };

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
    if (!user) throw new NotFoundException('Compte introuvable.');

    const nom = dto.nom.trim();
    const memeNom = siennes.find((m) => m.account.name.trim().toLowerCase() === nom.toLowerCase());
    if (memeNom) return { ok: true, accountId: memeNom.accountId, existant: true };

    const slug = await this.slugUnique(nom);

    // CE QUE L'ÉTAT PUBLIE DÉJÀ, ON NE LE REDEMANDE PAS. Avec un SIREN, on va
    // chercher la fiche dans SIRENE et dans la liste publique des organismes
    // de formation : le SIRET, l'adresse, le numéro de déclaration et la
    // DREETS arrivent tout seuls. Ce que la personne a saisi passe d'abord.
    const prerempli = dto.siren ? await this.prerempli(dto.siren) : null;

    const resultat = await this.prisma.$transaction(async (tx) => {
      const account = await tx.account.create({
        data: {
          name: nom,
          type: AccountType.ACADEMIE,
          slug,
          legalName: nom,
          siret: dto.siret ?? prerempli?.siret ?? null,
          address: prerempli?.adresse ?? null,
          postalCode: prerempli?.codePostal ?? null,
          city: prerempli?.commune ?? null,
          contactEmail: user.email,
          ownerId: user.id,
          source: 'pilote.toulali.fr',
        },
      });
      await tx.membership.create({
        data: { userId: user.id, accountId: account.id, role: AccountRole.OWNER, status: MembershipStatus.ACTIVE },
      });
      const academie = await tx.academie.create({
        data: {
          accountId: account.id,
          nom,
          sigle: prerempli?.sigle ?? null,
          siren: dto.siren ?? null,
          siret: dto.siret ?? prerempli?.siret ?? null,
          ape: prerempli?.ape ?? null,
          nda: dto.nda ?? prerempli?.nda ?? null,
          dreets: prerempli?.dreets ?? null,
          adresse: prerempli?.adresse ?? null,
          codePostal: prerempli?.codePostal ?? null,
          commune: prerempli?.commune ?? null,
          courriel: user.email,
          qualiopi: dto.qualiopi ?? (prerempli?.certifie ? EtatQualiopi.CERTIFIE : EtatQualiopi.PAS_ENGAGE),
        },
      });
      return { account, academie };
    });

    return { ok: true, accountId: resultat.account.id, existant: false };
  }

  /**
   * La fiche publique d'un organisme, si les répertoires la connaissent. Une
   * panne d'API ne doit JAMAIS empêcher d'ouvrir un espace : on renvoie null
   * et la personne remplit à la main.
   */
  private async prerempli(siren: string) {
    try {
      return prerempliDepuis(await this.repertoires.fiche(siren));
    } catch {
      return null;
    }
  }

  private async slugUnique(nom: string) {
    const base =
      nom
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48) || 'academie';
    let candidat = base;
    for (let i = 2; i < 200; i += 1) {
      const pris = await this.prisma.account.findUnique({ where: { slug: candidat }, select: { id: true } });
      if (!pris) return candidat;
      candidat = `${base}-${i}`;
    }
    return `${base}-${Date.now().toString(36)}`;
  }

  // ----------------------------------------------------------------- fiche

  /** La fiche du compte, en s'assurant que le compte est bien une académie. */
  private async fiche(accountId: string) {
    const compte = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { id: true, type: true, name: true, academie: true },
    });
    if (!compte) throw new NotFoundException('Compte introuvable.');
    if (compte.type !== AccountType.ACADEMIE) {
      throw new ForbiddenException("Cet espace est réservé aux comptes de type académie.");
    }
    // Un compte créé avant ce module n'a pas encore sa fiche : on la pose.
    if (!compte.academie) {
      return this.prisma.academie.create({ data: { accountId: compte.id, nom: compte.name } });
    }
    return compte.academie;
  }

  async monAcademie(accountId: string) {
    return this.fiche(accountId);
  }

  async modifier(accountId: string, dto: ModifierAcademieDto) {
    const fiche = await this.fiche(accountId);
    const data: Prisma.AcademieUpdateInput = {};
    const texte = [
      'nom', 'sigle', 'nda', 'dreets', 'siren', 'siret', 'ape', 'adresse', 'codePostal',
      'commune', 'telephone', 'courriel', 'siteWeb', 'certificateur', 'referentHandicap',
      'referentPedagogique', 'resume', 'presentation',
    ] as const;
    for (const champ of texte) {
      const valeur = dto[champ];
      if (valeur !== undefined) (data as Record<string, unknown>)[champ] = valeur.trim() || null;
    }
    for (const champ of ['ndaDeposeLe', 'auditPrevuLe', 'certifieDu', 'certifieAu'] as const) {
      const valeur = dto[champ];
      if (valeur !== undefined) (data as Record<string, unknown>)[champ] = valeur ? new Date(valeur) : null;
    }
    if (dto.qualiopi !== undefined) data.qualiopi = dto.qualiopi;

    const majouree = await this.prisma.academie.update({ where: { id: fiche.id }, data });
    // Le nom de la fiche fait foi : le compte suit.
    if (dto.nom !== undefined && dto.nom.trim()) {
      await this.prisma.account.update({ where: { id: accountId }, data: { name: dto.nom.trim() } });
    }
    return majouree;
  }

  // ---------------------------------------------------------------- chemin

  /**
   * Le chemin, avec ses étapes cochées. Une étape « déduite » se coche toute
   * seule dès que la donnée arrive dans la fiche — on ne demande jamais à
   * quelqu'un de cocher ce qu'on sait déjà.
   */
  private composerChemin(fiche: {
    etapesFaites: string[];
    nda: string | null;
    siret: string | null;
    referentHandicap: string | null;
    auditPrevuLe: Date | null;
    certifieDu: Date | null;
  }) {
    const aLaMain = new Set(fiche.etapesFaites);
    const etapes = ETAPES_ACADEMIE.map((e) => {
      const deduite = e.deduite ? Boolean(fiche[e.deduite]) : false;
      return {
        slug: e.slug,
        numero: e.numero,
        titre: e.titre,
        resume: e.resume,
        pourPasser: e.pourPasser,
        faite: deduite || aLaMain.has(e.slug),
        automatique: deduite,
      };
    });
    const faites = etapes.filter((e) => e.faite).length;
    return {
      version: VERSION_CHEMIN_ACADEMIE,
      etapes,
      faites,
      total: etapes.length,
      // La première étape non faite : c'est celle qu'on met en avant.
      courante: etapes.find((e) => !e.faite)?.slug ?? null,
    };
  }

  async marquerEtape(accountId: string, slug: string, faite: boolean) {
    const etape = trouverEtapeAcademie(slug);
    if (!etape) throw new NotFoundException("Cette étape n'existe pas.");
    const fiche = await this.fiche(accountId);
    const actuelles = new Set(fiche.etapesFaites);
    if (faite) actuelles.add(slug);
    else actuelles.delete(slug);
    const majouree = await this.prisma.academie.update({
      where: { id: fiche.id },
      data: { etapesFaites: [...actuelles] },
    });
    return this.composerChemin(majouree);
  }

  // ----------------------------------------------------------------- veille

  async veilles(accountId: string) {
    const fiche = await this.fiche(accountId);
    return this.prisma.veilleEntree.findMany({
      where: { academieId: fiche.id },
      orderBy: { date: 'desc' },
      take: 300,
    });
  }

  async creerVeille(accountId: string, dto: VeilleDto) {
    const fiche = await this.fiche(accountId);
    return this.prisma.veilleEntree.create({
      data: {
        academieId: fiche.id,
        type: dto.type,
        date: new Date(dto.date),
        titre: dto.titre.trim(),
        source: dto.source?.trim() || null,
        lien: dto.lien?.trim() || null,
        resume: dto.resume?.trim() || null,
        consequence: dto.consequence?.trim() || null,
      },
    });
  }

  async modifierVeille(accountId: string, id: string, dto: ModifierVeilleDto) {
    const fiche = await this.fiche(accountId);
    const existante = await this.prisma.veilleEntree.findFirst({ where: { id, academieId: fiche.id } });
    if (!existante) throw new NotFoundException('Cette entrée de veille est introuvable.');
    return this.prisma.veilleEntree.update({
      where: { id },
      data: {
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.date !== undefined ? { date: new Date(dto.date) } : {}),
        ...(dto.titre !== undefined ? { titre: dto.titre.trim() } : {}),
        ...(dto.source !== undefined ? { source: dto.source.trim() || null } : {}),
        ...(dto.lien !== undefined ? { lien: dto.lien.trim() || null } : {}),
        ...(dto.resume !== undefined ? { resume: dto.resume.trim() || null } : {}),
        ...(dto.consequence !== undefined ? { consequence: dto.consequence.trim() || null } : {}),
      },
    });
  }

  async supprimerVeille(accountId: string, id: string) {
    const fiche = await this.fiche(accountId);
    const existante = await this.prisma.veilleEntree.findFirst({ where: { id, academieId: fiche.id } });
    if (!existante) throw new NotFoundException('Cette entrée de veille est introuvable.');
    await this.prisma.veilleEntree.delete({ where: { id } });
    return { ok: true };
  }

  // ------------------------------------------------------------ réclamations

  async reclamations(accountId: string) {
    const fiche = await this.fiche(accountId);
    return this.prisma.reclamation.findMany({
      where: { academieId: fiche.id },
      orderBy: { recueLe: 'desc' },
      take: 300,
    });
  }

  async creerReclamation(accountId: string, dto: ReclamationDto) {
    const fiche = await this.fiche(accountId);
    return this.prisma.reclamation.create({
      data: {
        academieId: fiche.id,
        recueLe: new Date(dto.recueLe),
        origine: dto.origine ?? undefined,
        auteur: dto.auteur?.trim() || null,
        objet: dto.objet.trim(),
        detail: dto.detail?.trim() || null,
        traitement: dto.traitement?.trim() || null,
        clotureeLe: dto.clotureeLe ? new Date(dto.clotureeLe) : null,
        statut: dto.statut ?? undefined,
      },
    });
  }

  async modifierReclamation(accountId: string, id: string, dto: ModifierReclamationDto) {
    const fiche = await this.fiche(accountId);
    const existante = await this.prisma.reclamation.findFirst({ where: { id, academieId: fiche.id } });
    if (!existante) throw new NotFoundException('Cette réclamation est introuvable.');
    return this.prisma.reclamation.update({
      where: { id },
      data: {
        ...(dto.recueLe !== undefined ? { recueLe: new Date(dto.recueLe) } : {}),
        ...(dto.origine !== undefined ? { origine: dto.origine } : {}),
        ...(dto.auteur !== undefined ? { auteur: dto.auteur.trim() || null } : {}),
        ...(dto.objet !== undefined ? { objet: dto.objet.trim() } : {}),
        ...(dto.detail !== undefined ? { detail: dto.detail.trim() || null } : {}),
        ...(dto.traitement !== undefined ? { traitement: dto.traitement.trim() || null } : {}),
        ...(dto.clotureeLe !== undefined ? { clotureeLe: dto.clotureeLe ? new Date(dto.clotureeLe) : null } : {}),
        ...(dto.statut !== undefined ? { statut: dto.statut } : {}),
      },
    });
  }

  async supprimerReclamation(accountId: string, id: string) {
    const fiche = await this.fiche(accountId);
    const existante = await this.prisma.reclamation.findFirst({ where: { id, academieId: fiche.id } });
    if (!existante) throw new NotFoundException('Cette réclamation est introuvable.');
    await this.prisma.reclamation.delete({ where: { id } });
    return { ok: true };
  }

  // ----------------------------------------------------------------- espace

  /**
   * L'espace complet : la fiche, le chemin, et ce que le métier sait déjà —
   * catalogue, sessions à venir, apprenants, couverture Qualiopi. Un seul
   * appel : c'est ce qui rend l'accueil instantané.
   */
  async espace(accountId: string) {
    const fiche = await this.fiche(accountId);
    const maintenant = new Date();
    const dans90Jours = new Date(maintenant.getTime() + 90 * 24 * 3600 * 1000);

    const [formations, sessionsAVenir, inscriptions, preuves, indicateurs, veilles, reclamationsOuvertes] =
      await Promise.all([
        this.prisma.formation.findMany({
          where: { ownerAccountId: accountId },
          select: { id: true, title: true, slug: true, status: true, durationHours: true, updatedAt: true },
          orderBy: { updatedAt: 'desc' },
          take: 50,
        }),
        this.prisma.formationSession.findMany({
          where: {
            formation: { ownerAccountId: accountId },
            startDate: { gte: maintenant, lte: dans90Jours },
            status: { not: SessionStatus.CANCELLED },
          },
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            location: true,
            maxSeats: true,
            status: true,
            formation: { select: { title: true } },
            _count: { select: { inscriptions: true } },
          },
          orderBy: { startDate: 'asc' },
          take: 25,
        }),
        this.prisma.inscription.groupBy({
          by: ['status'],
          where: { session: { formation: { ownerAccountId: accountId } } },
          _count: { _all: true },
        }),
        this.prisma.qualiopiProof.findMany({
          where: { ofAccountId: accountId },
          select: { indicatorId: true, status: true },
        }),
        this.prisma.qualiopiIndicator.count(),
        this.prisma.veilleEntree.findMany({
          where: { academieId: fiche.id },
          orderBy: { date: 'desc' },
          take: 5,
          select: { id: true, type: true, date: true, titre: true },
        }),
        this.prisma.reclamation.count({
          where: { academieId: fiche.id, statut: { in: ['OUVERTE', 'EN_COURS'] } },
        }),
      ]);

    const validees = preuves.filter((p) => p.status === ProofStatus.VALIDATED).length;
    const deposees = preuves.filter((p) => p.status === ProofStatus.UPLOADED).length;

    const parStatut: Record<string, number> = {};
    for (const l of inscriptions) parStatut[l.status] = l._count._all;

    return {
      academie: fiche,
      chemin: this.composerChemin(fiche),
      catalogue: {
        total: formations.length,
        publiees: formations.filter((f) => f.status === FormationStatus.PUBLISHED).length,
        formations,
      },
      sessions: sessionsAVenir.map((s) => ({
        id: s.id,
        titre: s.title ?? s.formation.title,
        debut: s.startDate,
        fin: s.endDate,
        lieu: s.location,
        places: s.maxSeats,
        inscrits: s._count.inscriptions,
        statut: s.status,
      })),
      apprenants: {
        total: inscriptions.reduce((n, l) => n + l._count._all, 0),
        confirmes: parStatut[InscriptionStatus.CONFIRMED] ?? 0,
        presents: parStatut[InscriptionStatus.ATTENDED] ?? 0,
        certifies: parStatut[InscriptionStatus.CERTIFIED] ?? 0,
      },
      qualiopi: {
        etat: fiche.qualiopi,
        indicateurs,
        validees,
        deposees,
        // Une preuve déposée compte à moitié : elle existe, elle n'est pas encore revue.
        couverture: indicateurs ? Math.round(((validees + deposees * 0.5) / indicateurs) * 100) : 0,
        auditPrevuLe: fiche.auditPrevuLe,
        certifieAu: fiche.certifieAu,
      },
      veille: { dernieres: veilles, total: veilles.length },
      reclamations: { ouvertes: reclamationsOuvertes },
    };
  }
}
