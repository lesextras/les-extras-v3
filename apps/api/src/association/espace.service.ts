import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AccountRole,
  AccountType,
  EtatDossier,
  EtatPiece,
  FileKind,
  MembershipStatus,
  Prisma,
  UserStatus,
  type DossierFinancement,
  type GlobalRole,
  type PieceAssociation,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService, type FichierRecu } from '../storage/files.service';
import { AssociationService, type AssociationPublique } from './association.service';
import {
  DISPOSITIFS,
  TYPES_DE_PIECES,
  VERSION_REFERENTIEL,
  trouverTypeDePiece,
  type TypeDePiece,
} from './referentiel-pieces';
import { ETAPES_CHEMIN } from './chemin';
import type {
  DossierDto,
  InscriptionAssociationDto,
  ModifierDossierDto,
  ModifierOrganisationDto,
  ModifierPieceDto,
} from './dto/espace.dto';

const BCRYPT_ROUNDS = 12;

export type SituationPiece = 'DEDUITE' | 'A_JOUR' | 'BIENTOT_PERIMEE' | 'PERIMEE' | 'MANQUANTE';

export interface PieceDecoree {
  typeCode: string;
  etat: EtatPiece;
  situation: SituationPiece;
  preuve: string | null;
  fileId: string | null;
  dateEmission: Date | null;
  dateExpiration: Date | null;
  exercice: number | null;
  note: string | null;
  updatedAt: Date;
}

export interface LigneClasseur {
  type: TypeDePiece;
  piece: PieceDecoree | null;
  situation: SituationPiece;
}
const JOUR = 86_400_000;
/** Fenêtre d'alerte : ce qui périme ou échoit dans les 60 jours passe en ambre. */
const HORIZON_JOURS = 60;

/**
 * L'ESPACE D'UNE ASSOCIATION.
 *
 * Tout ce que l'association possède en propre : son identité, son classeur,
 * ses dossiers, son avancement sur le chemin. Et l'écran du lundi, qui ne
 * demande rien : il lit ce qui précède et dit ce qui presse.
 *
 * Règles :
 *  - une pièce déduite des données publiques n'est jamais « à fournir » ;
 *  - une pièce à péremption se signale 60 jours avant, et reste signalée
 *    jusqu'à ce qu'elle soit remplacée, jamais parce qu'on l'a « vue » ;
 *  - rien de vert dans les blocs d'alerte : s'il n'y a rien, on le dit.
 */
@Injectable()
export class EspaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly files: FilesService,
    private readonly publiques: AssociationService,
  ) {}

  // ---------------------------------------------------------------- inscription

  async inscrire(dto: InscriptionAssociationDto) {
    const email = dto.email.trim().toLowerCase();
    const existant = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existant) {
      throw new ConflictException('Un compte existe déjà avec cette adresse. Connectez-vous.');
    }

    // Pré-remplissage depuis les répertoires publics, si un SIREN est donné.
    let publique: AssociationPublique | null = null;
    if (dto.siren) {
      try {
        publique = (await this.publiques.fiche(dto.siren)).association;
      } catch {
        publique = null;
      }
    }

    const nomAssociation = (publique?.nom ?? dto.nomAssociation).trim();
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const slug = await this.slugUnique(nomAssociation);

    const resultat = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: passwordHash,
          firstName: dto.prenom.trim(),
          lastName: dto.nom.trim(),
          // Pas de parcours de vérification Les Extras ici : l'espace
          // association n'en dépend pas, et ses courriers viendront plus tard.
          status: UserStatus.VERIFIED,
          emailVerified: true,
          onboardingStep: 3,
          hebdoOptIn: false,
          profile: { create: {} },
        },
      });
      const account = await tx.account.create({
        data: {
          name: nomAssociation,
          type: AccountType.ASSOCIATION,
          slug,
          legalName: nomAssociation,
          siret: publique?.siret ?? null,
          address: publique?.adresse ?? null,
          city: publique?.commune ?? null,
          postalCode: publique?.codePostal ?? null,
          contactEmail: email,
          ownerId: user.id,
          source: dto.source ?? 'association.toulali.fr',
        },
      });
      await tx.membership.create({
        data: {
          userId: user.id,
          accountId: account.id,
          role: AccountRole.OWNER,
          status: MembershipStatus.ACTIVE,
        },
      });
      const organisation = await tx.organisation.create({
        data: {
          accountId: account.id,
          nom: nomAssociation,
          sigle: publique?.sigle ?? null,
          rna: publique?.rna ?? null,
          siren: publique?.siren ?? dto.siren ?? null,
          siret: publique?.siret ?? null,
          natureJuridique: publique?.natureJuridique ?? null,
          adresse: publique?.adresse ?? null,
          codePostal: publique?.codePostal ?? null,
          commune: publique?.commune ?? null,
          dateCreation: publique?.dateCreation ? new Date(publique.dateCreation) : null,
        },
      });
      return { user, account, organisation };
    });

    await this.synchroniserPiecesDeduites(resultat.organisation.id);
    return { ok: true, accountId: resultat.account.id };
  }

  // ------------------------------------------------------------- organisation

  async organisationDuCompte(accountId: string) {
    const compte = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { id: true, type: true, name: true, organisation: true },
    });
    if (!compte || compte.type !== AccountType.ASSOCIATION) {
      throw new ForbiddenException("Ce compte n'est pas un compte d'association.");
    }
    if (compte.organisation) return compte.organisation;
    // Compte association sans organisation (ne devrait pas arriver) : on la crée.
    const organisation = await this.prisma.organisation.create({
      data: { accountId: compte.id, nom: compte.name },
    });
    return organisation;
  }

  /** Rattache (ou re-rattache) l'organisation à sa fiche publique par SIREN. */
  async rattacher(accountId: string, siren: string) {
    const organisation = await this.organisationDuCompte(accountId);
    const { association: p } = await this.publiques.fiche(siren);
    const maj = await this.prisma.organisation.update({
      where: { id: organisation.id },
      data: {
        nom: p.nom,
        sigle: p.sigle,
        rna: p.rna,
        siren: p.siren,
        siret: p.siret,
        natureJuridique: p.natureJuridique,
        adresse: p.adresse,
        codePostal: p.codePostal,
        commune: p.commune,
        dateCreation: p.dateCreation ? new Date(p.dateCreation) : null,
      },
    });
    await this.prisma.account.update({
      where: { id: accountId },
      data: { name: p.nom, legalName: p.nom, siret: p.siret, address: p.adresse, city: p.commune, postalCode: p.codePostal },
    });
    await this.synchroniserPiecesDeduites(maj.id);
    return this.espace(accountId);
  }

  async modifierOrganisation(accountId: string, dto: ModifierOrganisationDto) {
    const organisation = await this.organisationDuCompte(accountId);
    const maj = await this.prisma.organisation.update({
      where: { id: organisation.id },
      data: {
        nom: dto.nom?.trim(),
        sigle: dto.sigle?.trim(),
        rna: dto.rna?.trim(),
        siret: dto.siret?.trim(),
        adresse: dto.adresse?.trim(),
        codePostal: dto.codePostal?.trim(),
        commune: dto.commune?.trim(),
        niveau: dto.niveau,
        moisClotureExercice: dto.moisClotureExercice,
      },
    });
    if (dto.nom) {
      await this.prisma.account.update({ where: { id: accountId }, data: { name: dto.nom.trim() } });
    }
    await this.synchroniserPiecesDeduites(maj.id);
    return maj;
  }

  /**
   * Les pièces que les données publiques prouvent passent DEDUITE ; si la
   * preuve disparaît (RNA retiré à la main), elles redeviennent à fournir,
   * sauf si un fichier a été déposé entre-temps.
   */
  private async synchroniserPiecesDeduites(organisationId: string) {
    const o = await this.prisma.organisation.findUniqueOrThrow({ where: { id: organisationId } });
    for (const type of TYPES_DE_PIECES) {
      if (!type.deductible) continue;
      const preuve =
        type.deductible === 'RNA' && o.rna ? `Numéro RNA ${o.rna}` : type.deductible === 'SIRENE' && o.siret ? `SIRET ${o.siret}` : null;
      const existante = await this.prisma.pieceAssociation.findUnique({
        where: { organisationId_typeCode: { organisationId, typeCode: type.code } },
      });
      if (preuve) {
        if (!existante) {
          await this.prisma.pieceAssociation.create({
            data: { organisationId, typeCode: type.code, etat: EtatPiece.DEDUITE, preuve },
          });
        } else if (existante.etat !== EtatPiece.PRESENTE) {
          await this.prisma.pieceAssociation.update({
            where: { id: existante.id },
            data: { etat: EtatPiece.DEDUITE, preuve },
          });
        }
      } else if (existante && existante.etat === EtatPiece.DEDUITE) {
        await this.prisma.pieceAssociation.update({
          where: { id: existante.id },
          data: { etat: EtatPiece.A_FOURNIR, preuve: null },
        });
      }
    }
  }

  // ------------------------------------------------------------------ classeur

  async deposerPiece(
    accountId: string,
    userId: string,
    typeCode: string,
    fichier: FichierRecu,
    dto: ModifierPieceDto,
  ) {
    const type = trouverTypeDePiece(typeCode);
    if (!type) throw new NotFoundException('Ce type de pièce est inconnu.');
    const organisation = await this.organisationDuCompte(accountId);

    const depose = await this.files.deposer({
      fichier,
      famille: FileKind.COMPLIANCE,
      userId,
      accountId,
    });

    const dateEmission = dto.dateEmission ? new Date(dto.dateEmission) : new Date();
    const dateExpiration = dto.dateExpiration
      ? new Date(dto.dateExpiration)
      : type.dureeValiditeMois
        ? this.ajouterMois(dateEmission, type.dureeValiditeMois)
        : null;

    const piece = await this.prisma.pieceAssociation.upsert({
      where: { organisationId_typeCode: { organisationId: organisation.id, typeCode: type.code } },
      create: {
        organisationId: organisation.id,
        typeCode: type.code,
        etat: EtatPiece.PRESENTE,
        fileId: depose.id,
        dateEmission,
        dateExpiration,
        exercice: dto.exercice ?? (type.parExercice ? dateEmission.getFullYear() : null),
        note: dto.note ?? null,
      },
      update: {
        etat: EtatPiece.PRESENTE,
        fileId: depose.id,
        dateEmission,
        dateExpiration,
        exercice: dto.exercice ?? (type.parExercice ? dateEmission.getFullYear() : undefined),
        note: dto.note ?? undefined,
      },
    });
    return this.decorerPiece(piece);
  }

  async modifierPiece(accountId: string, typeCode: string, dto: ModifierPieceDto) {
    const type = trouverTypeDePiece(typeCode);
    if (!type) throw new NotFoundException('Ce type de pièce est inconnu.');
    const organisation = await this.organisationDuCompte(accountId);
    const piece = await this.prisma.pieceAssociation.upsert({
      where: { organisationId_typeCode: { organisationId: organisation.id, typeCode: type.code } },
      create: {
        organisationId: organisation.id,
        typeCode: type.code,
        dateEmission: dto.dateEmission ? new Date(dto.dateEmission) : null,
        dateExpiration: dto.dateExpiration ? new Date(dto.dateExpiration) : null,
        exercice: dto.exercice ?? null,
        note: dto.note ?? null,
      },
      update: {
        dateEmission: dto.dateEmission === undefined ? undefined : dto.dateEmission ? new Date(dto.dateEmission) : null,
        dateExpiration:
          dto.dateExpiration === undefined ? undefined : dto.dateExpiration ? new Date(dto.dateExpiration) : null,
        exercice: dto.exercice === undefined ? undefined : dto.exercice,
        note: dto.note === undefined ? undefined : dto.note,
      },
    });
    return this.decorerPiece(piece);
  }

  async retirerFichier(accountId: string, userId: string, role: GlobalRole, typeCode: string) {
    const organisation = await this.organisationDuCompte(accountId);
    const piece = await this.prisma.pieceAssociation.findUnique({
      where: { organisationId_typeCode: { organisationId: organisation.id, typeCode } },
    });
    if (!piece) throw new NotFoundException('Aucune pièce de ce type.');
    const fileId = piece.fileId;
    const type = trouverTypeDePiece(typeCode);
    const preuve =
      type?.deductible === 'RNA' && organisation.rna
        ? `Numéro RNA ${organisation.rna}`
        : type?.deductible === 'SIRENE' && organisation.siret
          ? `SIRET ${organisation.siret}`
          : null;
    await this.prisma.pieceAssociation.update({
      where: { id: piece.id },
      data: {
        fileId: null,
        etat: preuve ? EtatPiece.DEDUITE : EtatPiece.A_FOURNIR,
        preuve,
        dateEmission: null,
        dateExpiration: null,
      },
    });
    if (fileId) {
      await this.files.supprimer(fileId, userId, role).catch(() => undefined);
    }
    return { ok: true };
  }

  // -------------------------------------------------------------------- chemin

  async marquerEtape(accountId: string, slug: string, faite: boolean) {
    const etape = ETAPES_CHEMIN.find((e) => e.slug === slug);
    if (!etape) throw new NotFoundException("Cette étape n'existe pas.");
    const organisation = await this.organisationDuCompte(accountId);
    const actuelles = new Set(organisation.etapesFaites);
    if (faite) actuelles.add(slug);
    else actuelles.delete(slug);
    await this.prisma.organisation.update({
      where: { id: organisation.id },
      data: { etapesFaites: [...actuelles] },
    });
    return { etapesFaites: [...actuelles] };
  }

  // ------------------------------------------------------------------ dossiers

  async creerDossier(accountId: string, dto: DossierDto) {
    const organisation = await this.organisationDuCompte(accountId);
    const dispositif = dto.dispositifCode ? DISPOSITIFS.find((d) => d.code === dto.dispositifCode) : undefined;
    const dossier = await this.prisma.dossierFinancement.create({
      data: {
        organisationId: organisation.id,
        dispositifCode: dispositif?.code ?? null,
        financeur: dto.financeur.trim(),
        intitule: dto.intitule.trim(),
        etat: dto.etat ?? EtatDossier.REPERE,
        montantDemande: dto.montantDemande ?? null,
        montantAccorde: dto.montantAccorde ?? null,
        dateLimiteDepot: dto.dateLimiteDepot ? new Date(dto.dateLimiteDepot) : null,
        dateDepot: dto.dateDepot ? new Date(dto.dateDepot) : null,
        dateDecision: dto.dateDecision ? new Date(dto.dateDecision) : null,
        dateCompteRendu: dto.dateCompteRendu ? new Date(dto.dateCompteRendu) : null,
        piecesExigees: dto.piecesExigees?.length ? dto.piecesExigees : (dispositif?.piecesExigees ?? []),
        notes: dto.notes ?? null,
      },
    });
    return this.dossier(accountId, dossier.id);
  }

  async modifierDossier(accountId: string, id: string, dto: ModifierDossierDto) {
    const organisation = await this.organisationDuCompte(accountId);
    const existant = await this.prisma.dossierFinancement.findFirst({ where: { id, organisationId: organisation.id } });
    if (!existant) throw new NotFoundException('Ce dossier est introuvable.');
    const date = (v: string | null | undefined) => (v === undefined ? undefined : v ? new Date(v) : null);
    const data: Prisma.DossierFinancementUpdateInput = {
      dispositifCode: dto.dispositifCode === undefined ? undefined : dto.dispositifCode,
      financeur: dto.financeur?.trim(),
      intitule: dto.intitule?.trim(),
      etat: dto.etat,
      montantDemande: dto.montantDemande === undefined ? undefined : dto.montantDemande,
      montantAccorde: dto.montantAccorde === undefined ? undefined : dto.montantAccorde,
      dateLimiteDepot: date(dto.dateLimiteDepot),
      dateDepot: date(dto.dateDepot),
      dateDecision: date(dto.dateDecision),
      dateCompteRendu: date(dto.dateCompteRendu),
      piecesExigees: dto.piecesExigees,
      notes: dto.notes === undefined ? undefined : dto.notes,
    };
    // Passer en DEPOSE sans date de dépôt : on prend aujourd'hui.
    if (dto.etat === EtatDossier.DEPOSE && !existant.dateDepot && dto.dateDepot === undefined) {
      data.dateDepot = new Date();
    }
    await this.prisma.dossierFinancement.update({ where: { id }, data });
    return this.dossier(accountId, id);
  }

  async supprimerDossier(accountId: string, id: string) {
    const organisation = await this.organisationDuCompte(accountId);
    const existant = await this.prisma.dossierFinancement.findFirst({ where: { id, organisationId: organisation.id } });
    if (!existant) throw new NotFoundException('Ce dossier est introuvable.');
    await this.prisma.dossierFinancement.delete({ where: { id } });
    return { ok: true };
  }

  /** Un dossier avec l'assemblage de ses pièces : présentes, à jour, manquantes. */
  async dossier(accountId: string, id: string) {
    const organisation = await this.organisationDuCompte(accountId);
    const d = await this.prisma.dossierFinancement.findFirst({ where: { id, organisationId: organisation.id } });
    if (!d) throw new NotFoundException('Ce dossier est introuvable.');
    const pieces = await this.prisma.pieceAssociation.findMany({ where: { organisationId: organisation.id } });
    const assemblage = d.piecesExigees.map((code) => {
      const type = trouverTypeDePiece(code);
      const piece = pieces.find((p) => p.typeCode === code);
      const deco = piece ? this.decorerPiece(piece) : null;
      return {
        code,
        libelle: type?.libelle ?? code,
        ouLaTrouver: type?.ouLaTrouver ?? null,
        etat: deco?.etat ?? EtatPiece.A_FOURNIR,
        situation: (deco?.situation ?? 'MANQUANTE') as SituationPiece,
        fileId: deco?.fileId ?? null,
        dateExpiration: deco?.dateExpiration ?? null,
      };
    });
    const pretes = assemblage.filter((a) => a.situation === 'A_JOUR' || a.situation === 'DEDUITE').length;
    return {
      ...this.decorerDossier(d),
      dispositif: d.dispositifCode ? (DISPOSITIFS.find((x) => x.code === d.dispositifCode) ?? null) : null,
      assemblage,
      completude: assemblage.length ? Math.round((pretes / assemblage.length) * 100) : 100,
      manquantes: assemblage.filter((a) => a.situation !== 'A_JOUR' && a.situation !== 'DEDUITE'),
    };
  }

  // ------------------------------------------------------------------- espace

  /** Tout ce qu'affiche l'espace, en un seul appel. */
  async espace(accountId: string) {
    const organisation = await this.organisationDuCompte(accountId);
    const [pieces, dossiers] = await Promise.all([
      this.prisma.pieceAssociation.findMany({ where: { organisationId: organisation.id } }),
      this.prisma.dossierFinancement.findMany({
        where: { organisationId: organisation.id },
        orderBy: [{ dateLimiteDepot: 'asc' }, { createdAt: 'desc' }],
      }),
    ]);

    const classeur: LigneClasseur[] = TYPES_DE_PIECES.map((type) => {
      const piece = pieces.find((p) => p.typeCode === type.code);
      const decoree = piece ? this.decorerPiece(piece) : null;
      return { type, piece: decoree, situation: decoree?.situation ?? 'MANQUANTE' };
    });

    const etapes = ETAPES_CHEMIN.map((e) => ({
      numero: e.numero,
      slug: e.slug,
      titre: e.titre,
      faite:
        organisation.etapesFaites.includes(e.slug) ||
        (e.verifiableAvec === 'RNA' && Boolean(organisation.rna)) ||
        (e.verifiableAvec === 'SIRENE' && Boolean(organisation.siret)),
      verifiee:
        (e.verifiableAvec === 'RNA' && Boolean(organisation.rna)) ||
        (e.verifiableAvec === 'SIRENE' && Boolean(organisation.siret)),
    }));
    const etapesFaites = etapes.filter((e) => e.faite).length;

    return {
      organisation,
      classeur,
      dossiers: dossiers.map((d) => this.decorerDossier(d)),
      chemin: { etapes, faites: etapesFaites, total: etapes.length, pourcentage: Math.round((etapesFaites / etapes.length) * 100) },
      lundi: this.ecranDuLundi(classeur, dossiers, organisation.etapesFaites.length + etapes.filter((e) => e.verifiee).length),
      versionReferentiel: VERSION_REFERENTIEL,
      dispositifs: DISPOSITIFS,
    };
  }

  /**
   * L'ÉCRAN DU LUNDI : quatre blocs, triés par gravité puis par date.
   * Une ligne disparaît quand l'action est faite, jamais quand elle est vue.
   */
  private ecranDuLundi(classeur: LigneClasseur[], dossiers: DossierFinancement[], etapesFaites: number) {
    const maintenant = Date.now();
    const horizon = maintenant + HORIZON_JOURS * JOUR;

    const perime = classeur
      .filter((c) => c.piece?.dateExpiration)
      .map((c) => {
        const t = new Date(c.piece!.dateExpiration!).getTime();
        return {
          typeCode: c.type.code,
          libelle: c.type.libelle,
          dateExpiration: c.piece!.dateExpiration,
          jours: Math.ceil((t - maintenant) / JOUR),
          gravite: t < maintenant ? 'ROUGE' : t < horizon ? 'AMBRE' : 'OK',
          action: t < maintenant ? 'renouveler' : 'renouveler avant échéance',
        };
      })
      .filter((l) => l.gravite !== 'OK')
      .sort((a, b) => a.jours - b.jours);

    const du = dossiers
      .flatMap((d) => {
        const lignes: {
          dossierId: string;
          intitule: string;
          financeur: string;
          echeance: Date;
          nature: 'DEPOT' | 'COMPTE_RENDU';
        }[] = [];
        if (d.dateLimiteDepot && (d.etat === EtatDossier.REPERE || d.etat === EtatDossier.EN_ECRITURE)) {
          lignes.push({ dossierId: d.id, intitule: d.intitule, financeur: d.financeur, echeance: d.dateLimiteDepot, nature: 'DEPOT' });
        }
        if (d.dateCompteRendu && d.etat === EtatDossier.ACCORDE) {
          lignes.push({ dossierId: d.id, intitule: d.intitule, financeur: d.financeur, echeance: d.dateCompteRendu, nature: 'COMPTE_RENDU' });
        }
        return lignes;
      })
      .map((l) => {
        const t = l.echeance.getTime();
        return { ...l, jours: Math.ceil((t - maintenant) / JOUR), gravite: t < maintenant ? 'ROUGE' : t < horizon ? 'AMBRE' : 'OK' };
      })
      .filter((l) => l.gravite !== 'OK')
      .sort((a, b) => a.jours - b.jours);

    const enCours = {
      enEcriture: dossiers.filter((d) => d.etat === EtatDossier.EN_ECRITURE).length,
      deposes: dossiers.filter((d) => d.etat === EtatDossier.DEPOSE).length,
      accordesAJustifier: dossiers.filter((d) => d.etat === EtatDossier.ACCORDE).length,
      refuses: dossiers.filter((d) => d.etat === EtatDossier.REFUSE).length,
      reperes: dossiers.filter((d) => d.etat === EtatDossier.REPERE).length,
    };

    // Ce qui manque : les pièces exigées par un dossier en cours et absentes du classeur.
    const manque = new Map<string, { typeCode: string; libelle: string; dossiers: number }>();
    for (const d of dossiers) {
      if (d.etat !== EtatDossier.REPERE && d.etat !== EtatDossier.EN_ECRITURE) continue;
      for (const code of d.piecesExigees) {
        const c = classeur.find((x) => x.type.code === code);
        if (!c || c.situation === 'A_JOUR' || c.situation === 'DEDUITE') continue;
        const e = manque.get(code) ?? { typeCode: code, libelle: c.type.libelle, dossiers: 0 };
        e.dossiers += 1;
        manque.set(code, e);
      }
    }

    const annee = new Date().getFullYear();
    const cetteAnnee = dossiers.filter((d) => (d.dateDecision ?? d.updatedAt).getFullYear() === annee);
    const accordes = cetteAnnee.filter((d) => d.etat === EtatDossier.ACCORDE || d.etat === EtatDossier.SOLDE);
    const finaux: EtatDossier[] = [EtatDossier.ACCORDE, EtatDossier.SOLDE, EtatDossier.REFUSE];
    const decides = cetteAnnee.filter((d) => finaux.includes(d.etat));
    const obtenu = accordes.reduce((s, d) => s + Number(d.montantAccorde ?? 0), 0);

    return {
      perime,
      du,
      enCours,
      manque: [...manque.values()].sort((a, b) => b.dossiers - a.dossiers),
      cetteAnnee: {
        annee,
        obtenu,
        dossiersAccordes: accordes.length,
        dossiersDecides: decides.length,
        tauxReussite: decides.length ? Math.round((accordes.length / decides.length) * 100) : null,
        piecesPerimees: perime.filter((p) => p.gravite === 'ROUGE').length,
        etapesFaites,
      },
    };
  }

  // -------------------------------------------------------------------- outils

  private decorerPiece(p: PieceAssociation): PieceDecoree {
    const maintenant = Date.now();
    let situation: SituationPiece = 'MANQUANTE';
    if (p.etat === EtatPiece.DEDUITE) situation = 'DEDUITE';
    else if (p.etat === EtatPiece.PRESENTE) {
      if (p.dateExpiration && p.dateExpiration.getTime() < maintenant) situation = 'PERIMEE';
      else if (p.dateExpiration && p.dateExpiration.getTime() < maintenant + HORIZON_JOURS * JOUR) situation = 'BIENTOT_PERIMEE';
      else situation = 'A_JOUR';
    }
    return {
      typeCode: p.typeCode,
      etat: p.etat,
      situation,
      preuve: p.preuve,
      fileId: p.fileId,
      dateEmission: p.dateEmission,
      dateExpiration: p.dateExpiration,
      exercice: p.exercice,
      note: p.note,
      updatedAt: p.updatedAt,
    };
  }

  private decorerDossier(d: DossierFinancement) {
    return {
      id: d.id,
      dispositifCode: d.dispositifCode,
      financeur: d.financeur,
      intitule: d.intitule,
      etat: d.etat,
      montantDemande: d.montantDemande === null ? null : Number(d.montantDemande),
      montantAccorde: d.montantAccorde === null ? null : Number(d.montantAccorde),
      dateLimiteDepot: d.dateLimiteDepot,
      dateDepot: d.dateDepot,
      dateDecision: d.dateDecision,
      dateCompteRendu: d.dateCompteRendu,
      piecesExigees: d.piecesExigees,
      notes: d.notes,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  }

  private ajouterMois(d: Date, mois: number) {
    const r = new Date(d);
    r.setMonth(r.getMonth() + mois);
    return r;
  }

  private async slugUnique(nom: string) {
    const base =
      nom
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || 'association';
    let slug = base;
    for (let i = 0; i < 20; i += 1) {
      const pris = await this.prisma.account.findUnique({ where: { slug }, select: { id: true } });
      if (!pris) return slug;
      slug = `${base}-${Math.random().toString(36).slice(2, 7)}`;
    }
    throw new BadRequestException("Impossible d'attribuer une adresse unique à ce compte. Réessayez.");
  }
}
