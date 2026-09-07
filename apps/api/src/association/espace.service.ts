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
  EtatAction,
  EtatDossier,
  EtatPiece,
  FileKind,
  MembershipStatus,
  Prisma,
  UserStatus,
  type ActionAssociation,
  type ContactAssociation,
  type DossierFinancement,
  type GlobalRole,
  type PieceAssociation,
  RoleContact,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService, type FichierRecu } from '../storage/files.service';
import { champsManquants, trouverModele, type Valeurs } from './fabrique';
import { rendrePdf } from './rendu';
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
  ActionDto,
  ContactDto,
  DocumentDto,
  DossierDto,
  InscriptionAssociationDto,
  LigneBudgetDto,
  ModifierActionDto,
  ModifierContactDto,
  ModifierDossierDto,
  ModifierOrganisationDto,
  ModifierPieceDto,
  OuvrirEspaceDto,
  ProjetDto,
  VieStatutaireDto,
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
      return this.creerEspace(tx, {
        userId: user.id,
        email,
        nomAssociation,
        slug,
        siren: dto.siren ?? null,
        publique,
        source: dto.source ?? 'association.toulali.fr',
      });
    });

    await this.synchroniserPiecesDeduites(resultat.organisation.id);
    return { ok: true, accountId: resultat.account.id };
  }

  /**
   * Ouvrir l'espace d'une association pour une personne qui a DÉJÀ un compte
   * (elle s'est connectée, mais aucun de ses comptes n'est une association).
   * Si elle en a déjà un, on le renvoie tel quel : l'appel est sans danger.
   */
  async ouvrir(userId: string, dto: OuvrirEspaceDto) {
    const deja = await this.prisma.membership.findFirst({
      where: { userId, status: MembershipStatus.ACTIVE, account: { type: AccountType.ASSOCIATION } },
      select: { accountId: true },
      orderBy: { createdAt: 'asc' },
    });
    if (deja) return { ok: true, accountId: deja.accountId, existant: true };

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
    if (!user) throw new NotFoundException('Compte introuvable.');

    let publique: AssociationPublique | null = null;
    if (dto.siren) {
      try {
        publique = (await this.publiques.fiche(dto.siren)).association;
      } catch {
        publique = null;
      }
    }
    const nomAssociation = (publique?.nom ?? dto.nomAssociation).trim();
    const slug = await this.slugUnique(nomAssociation);

    const resultat = await this.prisma.$transaction((tx) =>
      this.creerEspace(tx, {
        userId: user.id,
        email: user.email,
        nomAssociation,
        slug,
        siren: dto.siren ?? null,
        publique,
        source: 'association.toulali.fr',
      }),
    );
    await this.synchroniserPiecesDeduites(resultat.organisation.id);
    return { ok: true, accountId: resultat.account.id, existant: false };
  }

  /** Le compte ASSOCIATION, son membre propriétaire et son organisation, d'un bloc. */
  private async creerEspace(
    tx: Prisma.TransactionClient,
    p: {
      userId: string;
      email: string;
      nomAssociation: string;
      slug: string;
      siren: string | null;
      publique: AssociationPublique | null;
      source: string;
    },
  ) {
    const { publique } = p;
    const account = await tx.account.create({
      data: {
        name: p.nomAssociation,
        type: AccountType.ASSOCIATION,
        slug: p.slug,
        legalName: p.nomAssociation,
        siret: publique?.siret ?? null,
        address: publique?.adresse ?? null,
        city: publique?.commune ?? null,
        postalCode: publique?.codePostal ?? null,
        contactEmail: p.email,
        ownerId: p.userId,
        source: p.source,
      },
    });
    await tx.membership.create({
      data: {
        userId: p.userId,
        accountId: account.id,
        role: AccountRole.OWNER,
        status: MembershipStatus.ACTIVE,
      },
    });
    const organisation = await tx.organisation.create({
      data: {
        accountId: account.id,
        nom: p.nomAssociation,
        sigle: publique?.sigle ?? null,
        rna: publique?.rna ?? null,
        siren: publique?.siren ?? p.siren,
        siret: publique?.siret ?? null,
        natureJuridique: publique?.natureJuridique ?? null,
        adresse: publique?.adresse ?? null,
        codePostal: publique?.codePostal ?? null,
        commune: publique?.commune ?? null,
        dateCreation: publique?.dateCreation ? new Date(publique.dateCreation) : null,
      },
    });
    return { account, organisation };
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
        budgetPrevu: dto.budgetPrevu ? this.lignesBudget(dto.budgetPrevu) : undefined,
        budgetRealise: dto.budgetRealise ? this.lignesBudget(dto.budgetRealise) : undefined,
        bilanAction: dto.bilanAction ?? null,
        nombreBeneficiaires: dto.nombreBeneficiaires ?? null,
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
      budgetPrevu: dto.budgetPrevu === undefined ? undefined : this.lignesBudget(dto.budgetPrevu),
      budgetRealise: dto.budgetRealise === undefined ? undefined : this.lignesBudget(dto.budgetRealise),
      bilanAction: dto.bilanAction === undefined ? undefined : dto.bilanAction,
      nombreBeneficiaires: dto.nombreBeneficiaires === undefined ? undefined : dto.nombreBeneficiaires,
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

  // ------------------------------------------------------------------- projet

  /** Le projet en une page : quatre questions, et ce qu'on demande. */
  async modifierProjet(accountId: string, dto: ProjetDto) {
    const organisation = await this.organisationDuCompte(accountId);
    const nettoyer = (v: string | null | undefined) => (v === undefined ? undefined : v?.trim() || null);
    const maj = await this.prisma.organisation.update({
      where: { id: organisation.id },
      data: {
        projetPourQui: nettoyer(dto.pourQui),
        projetQuoi: nettoyer(dto.quoi),
        projetComment: nettoyer(dto.comment),
        projetApres: nettoyer(dto.apres),
        projetDemande: nettoyer(dto.demande),
      },
    });
    return this.projetDe(maj);
  }

  private projetDe(o: { projetPourQui: string | null; projetQuoi: string | null; projetComment: string | null; projetApres: string | null; projetDemande: string | null }) {
    const champs = [o.projetPourQui, o.projetQuoi, o.projetComment, o.projetApres];
    const remplis = champs.filter((c) => c && c.trim().length > 0).length;
    const texte = [
      o.projetPourQui ? `Pour qui ? ${o.projetPourQui.trim()}` : null,
      o.projetQuoi ? `Quoi ? ${o.projetQuoi.trim()}` : null,
      o.projetComment ? `Comment ? ${o.projetComment.trim()}` : null,
      o.projetApres ? `Et après ? ${o.projetApres.trim()}` : null,
      o.projetDemande ? `Ce que nous demandons : ${o.projetDemande.trim()}` : null,
    ]
      .filter(Boolean)
      .join('\n\n');
    return {
      pourQui: o.projetPourQui,
      quoi: o.projetQuoi,
      comment: o.projetComment,
      apres: o.projetApres,
      demande: o.projetDemande,
      remplis,
      complet: remplis === 4,
      texte,
    };
  }

  // ---------------------------------------------------------- vie statutaire

  async modifierVieStatutaire(accountId: string, dto: VieStatutaireDto) {
    const organisation = await this.organisationDuCompte(accountId);
    const maj = await this.prisma.organisation.update({
      where: { id: organisation.id },
      data: {
        dateDerniereAG: dto.dateDerniereAG === undefined ? undefined : dto.dateDerniereAG ? new Date(dto.dateDerniereAG) : null,
        dureeMandatMois: dto.dureeMandatMois,
      },
    });
    return this.vieStatutaireDe(maj, await this.prisma.contactAssociation.findMany({ where: { organisationId: maj.id } }));
  }

  private vieStatutaireDe(o: { dateDerniereAG: Date | null; dureeMandatMois: number }, contacts: ContactAssociation[]) {
    const maintenant = Date.now();
    const joursDepuisAG = o.dateDerniereAG ? Math.floor((maintenant - o.dateDerniereAG.getTime()) / JOUR) : null;
    const prochaineAG = o.dateDerniereAG ? this.ajouterMois(o.dateDerniereAG, 12) : null;
    const bureau = contacts.filter((c) => c.roles.some((r) => r === RoleContact.PRESIDENT || r === RoleContact.TRESORIER || r === RoleContact.SECRETAIRE));
    const mandatsExpires = bureau
      .filter((c) => c.mandatFin && c.mandatFin.getTime() < maintenant)
      .map((c) => ({ id: c.id, nom: `${c.prenom} ${c.nom}`, roles: c.roles, mandatFin: c.mandatFin }));
    const mandatsBientot = bureau
      .filter((c) => c.mandatFin && c.mandatFin.getTime() >= maintenant && c.mandatFin.getTime() < maintenant + HORIZON_JOURS * JOUR)
      .map((c) => ({ id: c.id, nom: `${c.prenom} ${c.nom}`, roles: c.roles, mandatFin: c.mandatFin }));
    return {
      dateDerniereAG: o.dateDerniereAG,
      dureeMandatMois: o.dureeMandatMois,
      joursDepuisAG,
      prochaineAG,
      agEnRetard: joursDepuisAG !== null && joursDepuisAG > 365,
      agBientot: prochaineAG !== null && prochaineAG.getTime() > maintenant && prochaineAG.getTime() < maintenant + HORIZON_JOURS * JOUR,
      bureau: {
        president: bureau.some((c) => c.roles.includes(RoleContact.PRESIDENT)),
        tresorier: bureau.some((c) => c.roles.includes(RoleContact.TRESORIER)),
        secretaire: bureau.some((c) => c.roles.includes(RoleContact.SECRETAIRE)),
      },
      mandatsExpires,
      mandatsBientot,
    };
  }

  // -------------------------------------------------------------- répertoire

  async contacts(accountId: string) {
    const organisation = await this.organisationDuCompte(accountId);
    const contacts = await this.prisma.contactAssociation.findMany({
      where: { organisationId: organisation.id },
      orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
    });
    return { contacts: contacts.map((c) => this.decorerContact(c)), resume: this.resumeContacts(contacts) };
  }

  async creerContact(accountId: string, dto: ContactDto) {
    const organisation = await this.organisationDuCompte(accountId);
    const c = await this.prisma.contactAssociation.create({
      data: {
        organisationId: organisation.id,
        prenom: dto.prenom.trim(),
        nom: dto.nom.trim(),
        email: dto.email?.trim().toLowerCase() || null,
        telephone: dto.telephone?.trim() || null,
        structure: dto.structure?.trim() || null,
        roles: dto.roles ?? [RoleContact.MEMBRE],
        dateAdhesion: dto.dateAdhesion ? new Date(dto.dateAdhesion) : null,
        cotisationAJour: dto.cotisationAJour ?? false,
        mandatDebut: dto.mandatDebut ? new Date(dto.mandatDebut) : null,
        mandatFin: dto.mandatFin ? new Date(dto.mandatFin) : null,
        notes: dto.notes?.trim() || null,
      },
    });
    return this.decorerContact(c);
  }

  async modifierContact(accountId: string, id: string, dto: ModifierContactDto) {
    const organisation = await this.organisationDuCompte(accountId);
    const existant = await this.prisma.contactAssociation.findFirst({ where: { id, organisationId: organisation.id } });
    if (!existant) throw new NotFoundException('Cette personne est introuvable.');
    const date = (v: string | null | undefined) => (v === undefined ? undefined : v ? new Date(v) : null);
    const texte = (v: string | null | undefined) => (v === undefined ? undefined : v?.trim() || null);
    const c = await this.prisma.contactAssociation.update({
      where: { id },
      data: {
        prenom: dto.prenom?.trim(),
        nom: dto.nom?.trim(),
        email: dto.email === undefined ? undefined : dto.email?.trim().toLowerCase() || null,
        telephone: texte(dto.telephone),
        structure: texte(dto.structure),
        roles: dto.roles,
        dateAdhesion: date(dto.dateAdhesion),
        cotisationAJour: dto.cotisationAJour,
        mandatDebut: date(dto.mandatDebut),
        mandatFin: date(dto.mandatFin),
        notes: texte(dto.notes),
      },
    });
    return this.decorerContact(c);
  }

  async supprimerContact(accountId: string, id: string) {
    const organisation = await this.organisationDuCompte(accountId);
    const existant = await this.prisma.contactAssociation.findFirst({ where: { id, organisationId: organisation.id } });
    if (!existant) throw new NotFoundException('Cette personne est introuvable.');
    await this.prisma.contactAssociation.delete({ where: { id } });
    return { ok: true };
  }

  private decorerContact(c: ContactAssociation) {
    return {
      id: c.id,
      prenom: c.prenom,
      nom: c.nom,
      email: c.email,
      telephone: c.telephone,
      structure: c.structure,
      roles: c.roles,
      dateAdhesion: c.dateAdhesion,
      cotisationAJour: c.cotisationAJour,
      mandatDebut: c.mandatDebut,
      mandatFin: c.mandatFin,
      notes: c.notes,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }

  private resumeContacts(contacts: ContactAssociation[]) {
    const equipe = (r: RoleContact) => contacts.filter((c) => c.roles.includes(r)).length;
    const membres = contacts.filter((c) => c.roles.includes(RoleContact.MEMBRE));
    return {
      total: contacts.length,
      membres: membres.length,
      membresAJour: membres.filter((c) => c.cotisationAJour).length,
      benevoles: equipe(RoleContact.BENEVOLE),
      salaries: equipe(RoleContact.SALARIE),
      partenaires: contacts.filter((c) => c.roles.includes(RoleContact.PARTENAIRE) || c.roles.includes(RoleContact.FINANCEUR) || c.roles.includes(RoleContact.ELU)).length,
      bureau: contacts
        .filter((c) => c.roles.some((r) => r === RoleContact.PRESIDENT || r === RoleContact.TRESORIER || r === RoleContact.SECRETAIRE))
        .map((c) => ({ id: c.id, nom: `${c.prenom} ${c.nom}`, roles: c.roles })),
    };
  }

  // ----------------------------------------------------------------- actions

  /** Les actions de l'association, la plus récente d'abord. */
  async actions(accountId: string) {
    const organisation = await this.organisationDuCompte(accountId);
    const actions = await this.prisma.actionAssociation.findMany({
      where: { organisationId: organisation.id },
      orderBy: [{ dateDebut: 'desc' }, { createdAt: 'desc' }],
    });
    return { actions, resume: this.resumeActions(actions) };
  }

  async creerAction(accountId: string, dto: ActionDto) {
    const organisation = await this.organisationDuCompte(accountId);
    return this.prisma.actionAssociation.create({
      data: {
        organisationId: organisation.id,
        intitule: dto.intitule.trim(),
        resume: dto.resume?.trim() || null,
        lieu: dto.lieu?.trim() || null,
        dateDebut: dto.dateDebut ? new Date(dto.dateDebut) : null,
        dateFin: dto.dateFin ? new Date(dto.dateFin) : null,
        etat: dto.etat ?? EtatAction.PREVUE,
        beneficiaires: dto.beneficiaires ?? null,
        benevoles: dto.benevoles ?? null,
        heuresBenevoles: dto.heuresBenevoles ?? null,
        cout: dto.cout ?? null,
        partenaires: dto.partenaires?.trim() || null,
        bilan: dto.bilan?.trim() || null,
      },
    });
  }

  async modifierAction(accountId: string, id: string, dto: ModifierActionDto) {
    const organisation = await this.organisationDuCompte(accountId);
    const existante = await this.prisma.actionAssociation.findFirst({ where: { id, organisationId: organisation.id } });
    if (!existante) throw new NotFoundException('Cette action est introuvable.');
    const date = (v: string | null | undefined) => (v === undefined ? undefined : v ? new Date(v) : null);
    const texte = (v: string | null | undefined) => (v === undefined ? undefined : v?.trim() || null);
    return this.prisma.actionAssociation.update({
      where: { id },
      data: {
        intitule: dto.intitule?.trim(),
        resume: texte(dto.resume),
        lieu: texte(dto.lieu),
        dateDebut: date(dto.dateDebut),
        dateFin: date(dto.dateFin),
        etat: dto.etat,
        beneficiaires: dto.beneficiaires,
        benevoles: dto.benevoles,
        heuresBenevoles: dto.heuresBenevoles,
        cout: dto.cout,
        partenaires: texte(dto.partenaires),
        bilan: texte(dto.bilan),
      },
    });
  }

  async supprimerAction(accountId: string, id: string) {
    const organisation = await this.organisationDuCompte(accountId);
    const existante = await this.prisma.actionAssociation.findFirst({ where: { id, organisationId: organisation.id } });
    if (!existante) throw new NotFoundException('Cette action est introuvable.');
    await this.prisma.actionAssociation.delete({ where: { id } });
    return { ok: true };
  }

  /** Les chiffres qu'un financeur demande toujours : combien d'actions, pour combien de personnes. */
  private resumeActions(actions: ActionAssociation[]) {
    const somme = (f: (a: ActionAssociation) => number | null) => actions.reduce((t, a) => t + (f(a) ?? 0), 0);
    const terminees = actions.filter((a) => a.etat === EtatAction.TERMINEE);
    return {
      total: actions.length,
      prevues: actions.filter((a) => a.etat === EtatAction.PREVUE).length,
      enCours: actions.filter((a) => a.etat === EtatAction.EN_COURS).length,
      terminees: terminees.length,
      beneficiaires: somme((a) => a.beneficiaires),
      benevoles: somme((a) => a.benevoles),
      heuresBenevoles: somme((a) => a.heuresBenevoles),
      cout: somme((a) => a.cout),
      sansBilan: terminees.filter((a) => !a.bilan).length,
    };
  }

  // --------------------------------------------------------------- documents

  async documents(accountId: string) {
    const organisation = await this.organisationDuCompte(accountId);
    const docs = await this.prisma.documentAssociation.findMany({
      where: { organisationId: organisation.id },
      orderBy: { createdAt: 'desc' },
      include: { file: { select: { id: true, originalName: true, size: true, mimeType: true } } },
    });
    return docs;
  }

  async deposerDocument(accountId: string, userId: string, fichier: FichierRecu, dto: DocumentDto) {
    const organisation = await this.organisationDuCompte(accountId);
    const depose = await this.files.deposer({ fichier, famille: FileKind.COMPLIANCE, userId, accountId });
    return this.prisma.documentAssociation.create({
      data: {
        organisationId: organisation.id,
        titre: dto.titre.trim(),
        categorie: dto.categorie?.trim() || null,
        note: dto.note?.trim() || null,
        fileId: depose.id,
      },
      include: { file: { select: { id: true, originalName: true, size: true, mimeType: true } } },
    });
  }

  /**
   * Fabrique un document (PDF) et le range au bon endroit : la pièce du
   * classeur qu'il produit, ou « mes documents » avec sa catégorie. Renvoie
   * de quoi l'ouvrir tout de suite.
   */
  async fabriquer(accountId: string, userId: string, code: string, valeurs: Valeurs) {
    const modele = trouverModele(code);
    if (!modele) throw new NotFoundException('Ce modèle est inconnu.');
    const manquants = champsManquants(modele, valeurs);
    if (manquants.length) throw new BadRequestException(`Il manque : ${manquants.join(', ')}.`);
    const doc = modele.construire(valeurs);
    const buffer = await rendrePdf(doc);
    const fichier: FichierRecu = { originalname: `${doc.nomFichier}.pdf`, mimetype: 'application/pdf', size: buffer.length, buffer };

    if (modele.piece) {
      const piece = await this.deposerPiece(accountId, userId, modele.piece, fichier, {});
      return { fileId: piece.fileId, nom: fichier.originalname, piece: modele.piece, range: 'CLASSEUR' as const };
    }
    const document = await this.deposerDocument(accountId, userId, fichier, { titre: doc.titre, categorie: modele.categorie });
    return { fileId: document.fileId, nom: fichier.originalname, documentId: document.id, range: 'DOCUMENTS' as const };
  }

  async supprimerDocument(accountId: string, userId: string, role: GlobalRole, id: string) {
    const organisation = await this.organisationDuCompte(accountId);
    const existant = await this.prisma.documentAssociation.findFirst({ where: { id, organisationId: organisation.id } });
    if (!existant) throw new NotFoundException('Ce document est introuvable.');
    await this.prisma.documentAssociation.delete({ where: { id } });
    if (existant.fileId) await this.files.supprimer(existant.fileId, userId, role).catch(() => undefined);
    return { ok: true };
  }

  // ------------------------------------------------------------------- espace

  /** Tout ce qu'affiche l'espace, en un seul appel. */
  async espace(accountId: string) {
    const organisation = await this.organisationDuCompte(accountId);
    const [pieces, dossiers, contacts, actions, nbDocuments] = await Promise.all([
      this.prisma.pieceAssociation.findMany({ where: { organisationId: organisation.id } }),
      this.prisma.dossierFinancement.findMany({
        where: { organisationId: organisation.id },
        orderBy: [{ dateLimiteDepot: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.contactAssociation.findMany({ where: { organisationId: organisation.id } }),
      this.prisma.actionAssociation.findMany({
        where: { organisationId: organisation.id },
        orderBy: [{ dateDebut: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.documentAssociation.count({ where: { organisationId: organisation.id } }),
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
    const projet = this.projetDe(organisation);
    const vieStatutaire = this.vieStatutaireDe(organisation, contacts);
    const repertoire = this.resumeContacts(contacts);

    // « Termine la configuration de ton espace » : cinq cases, comme un parcours d'accueil.
    const identite = classeur.filter((c) => c.type.categorie === 'IDENTITE');
    const identiteOk = identite.filter((c) => c.situation === 'A_JOUR' || c.situation === 'DEDUITE').length;
    const configuration = [
      { code: 'ESPACE', libelle: "Créer l'espace de mon association", faite: true, href: '/espace' },
      { code: 'RATTACHER', libelle: 'Rattacher mon association (RNA, SIRET)', faite: Boolean(organisation.rna || organisation.siret), href: '/espace/association' },
      { code: 'BUREAU', libelle: 'Noter qui est président, trésorier, secrétaire', faite: vieStatutaire.bureau.president && vieStatutaire.bureau.tresorier, href: '/espace/repertoire' },
      { code: 'PAPIERS', libelle: `Déposer les papiers d'identité (${identiteOk}/${identite.length})`, faite: identite.length > 0 && identiteOk === identite.length, href: '/espace/classeur' },
      { code: 'PROJET', libelle: 'Écrire le projet en une page', faite: projet.complet, href: '/espace/association#projet' },
      { code: 'ACTION', libelle: 'Noter une action de l’association', faite: actions.length > 0, href: '/espace/actions' },
      { code: 'DOSSIER', libelle: 'Créer mon premier dossier de subvention', faite: dossiers.length > 0, href: '/espace/dossiers' },
    ];
    const configurationFaites = configuration.filter((c) => c.faite).length;

    return {
      organisation,
      classeur,
      dossiers: dossiers.map((d) => this.decorerDossier(d)),
      chemin: { etapes, faites: etapesFaites, total: etapes.length, pourcentage: Math.round((etapesFaites / etapes.length) * 100) },
      lundi: this.ecranDuLundi(classeur, dossiers, organisation.etapesFaites.length + etapes.filter((e) => e.verifiee).length),
      projet,
      vieStatutaire,
      repertoire,
      actions,
      resumeActions: this.resumeActions(actions),
      nbDocuments,
      configuration: { etapes: configuration, faites: configurationFaites, total: configuration.length, pourcentage: Math.round((configurationFaites / configuration.length) * 100) },
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
      budgetPrevu: this.lireBudget(d.budgetPrevu),
      budgetRealise: this.lireBudget(d.budgetRealise),
      totaux: {
        prevu: this.totauxBudget(this.lireBudget(d.budgetPrevu)),
        realise: this.totauxBudget(this.lireBudget(d.budgetRealise)),
      },
      bilanAction: d.bilanAction,
      nombreBeneficiaires: d.nombreBeneficiaires,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  }

  private lignesBudget(lignes: LigneBudgetDto[]): Prisma.InputJsonValue {
    return lignes.map((l) => ({ libelle: l.libelle.trim(), montant: Math.round(l.montant * 100) / 100, sens: l.sens }));
  }

  private lireBudget(brut: Prisma.JsonValue | null): { libelle: string; montant: number; sens: 'DEPENSE' | 'RECETTE' }[] {
    if (!Array.isArray(brut)) return [];
    return brut
      .map((l) => (l && typeof l === 'object' && !Array.isArray(l) ? (l as Record<string, unknown>) : null))
      .filter((l): l is Record<string, unknown> => Boolean(l))
      .map((l) => ({
        libelle: String(l.libelle ?? ''),
        montant: Number(l.montant ?? 0),
        sens: l.sens === 'RECETTE' ? ('RECETTE' as const) : ('DEPENSE' as const),
      }));
  }

  private totauxBudget(lignes: { montant: number; sens: 'DEPENSE' | 'RECETTE' }[]) {
    const depenses = lignes.filter((l) => l.sens === 'DEPENSE').reduce((s, l) => s + l.montant, 0);
    const recettes = lignes.filter((l) => l.sens === 'RECETTE').reduce((s, l) => s + l.montant, 0);
    return { depenses, recettes, equilibre: Math.abs(depenses - recettes) < 0.005 };
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
