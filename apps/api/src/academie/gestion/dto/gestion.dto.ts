import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import {
  InscriptionStatus,
  FinancingType,
  ModaliteSession,
  NatureAction,
  ObjectifBpf,
  OrigineFinancement,
  SessionStatus,
  SousTraitance,
  StatutFormateur,
  TypeDocumentSession,
  TypeStagiaire,
  TypeFinanceur,
  StatutPriseEnCharge,
  EtapeProspect,
} from '@prisma/client';

/* ------------------------------------------------------------ annuaire */

export class FormateurDto {
  @IsString() @MinLength(1) @MaxLength(80) prenom!: string;
  @IsString() @MinLength(1) @MaxLength(80) nom!: string;
  @IsOptional() @IsEmail({}, { message: "L'adresse e-mail n'est pas valide." }) email?: string;
  @IsOptional() @IsString() @MaxLength(30) telephone?: string;
  @IsOptional() @IsEnum(StatutFormateur) statut?: StatutFormateur;
  @IsOptional() @IsString() @MaxLength(160) structure?: string;
  @IsOptional() @IsString() @Matches(/^\d{14}$/, { message: 'Le SIRET compte quatorze chiffres.' }) siret?: string;
  @IsOptional() @IsString() @MaxLength(120) metier?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(30) @IsString({ each: true }) @MaxLength(80, { each: true }) competences?: string[];
  @IsOptional() @IsString() @MaxLength(2000) diplomes?: string;
  @IsOptional() @IsBoolean() actif?: boolean;
}

export class ModifierFormateurDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(80) prenom?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(80) nom?: string;
  @IsOptional() @IsString() @MaxLength(160) email?: string;
  @IsOptional() @IsString() @MaxLength(30) telephone?: string;
  @IsOptional() @IsEnum(StatutFormateur) statut?: StatutFormateur;
  @IsOptional() @IsString() @MaxLength(160) structure?: string;
  @IsOptional() @IsString() @MaxLength(14) siret?: string;
  @IsOptional() @IsString() @MaxLength(120) metier?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(30) @IsString({ each: true }) @MaxLength(80, { each: true }) competences?: string[];
  @IsOptional() @IsString() @MaxLength(2000) diplomes?: string;
  @IsOptional() @IsBoolean() actif?: boolean;
}

export class SalleDto {
  @IsString() @MinLength(1) @MaxLength(120) nom!: string;
  @IsOptional() @IsString() @MaxLength(300) adresse?: string;
  @IsOptional() @IsInt() @Min(1) @Max(2000) capacite?: number;
  @IsOptional() @IsBoolean() accessiblePmr?: boolean;
  @IsOptional() @IsString() @MaxLength(1000) equipements?: string;
  @IsOptional() @IsBoolean() actif?: boolean;
}

export class ModifierSalleDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(120) nom?: string;
  @IsOptional() @IsString() @MaxLength(300) adresse?: string;
  @IsOptional() @IsInt() @Min(1) @Max(2000) capacite?: number;
  @IsOptional() @IsBoolean() accessiblePmr?: boolean;
  @IsOptional() @IsString() @MaxLength(1000) equipements?: string;
  @IsOptional() @IsBoolean() actif?: boolean;
}

/* ------------------------------------------------------------ sessions */

export class ModifierSessionAdminDto {
  @IsOptional() @IsString() @MaxLength(160) title?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsString() @MaxLength(300) location?: string;
  @IsOptional() @IsInt() @Min(1) @Max(5000) maxSeats?: number;
  @IsOptional() @IsNumber() @Min(0) priceHt?: number;
  @IsOptional() @IsEnum(SessionStatus) status?: SessionStatus;
  @IsOptional() @IsString() formateurOrganismeId?: string | null;
  @IsOptional() @IsString() salleId?: string | null;
  @IsOptional() @IsEnum(ModaliteSession) modalite?: ModaliteSession;
  @IsOptional() @IsInt() @Min(0) @Max(100) tauxDistanciel?: number | null;
  @IsOptional() @IsBoolean() intra?: boolean;
  @IsOptional() @IsEnum(SousTraitance) sousTraitance?: SousTraitance;
  @IsOptional() @IsString() @MaxLength(200) organismePartenaire?: string | null;
  @IsOptional() @IsNumber() @Min(0) @Max(5000) dureeHeures?: number | null;
  @IsOptional() @IsString() @MaxLength(2000) infosPratiques?: string | null;
  @IsOptional() @IsBoolean() enquetesAuto?: boolean;
  @IsOptional() @IsBoolean() convocationsAuto?: boolean;
  @IsOptional() @IsInt() @Min(14) @Max(365) delaiFroidJours?: number;
}

export class ProgrammeBpfDto {
  @IsOptional() @IsEnum(NatureAction) natureAction?: NatureAction;
  @IsOptional() @IsEnum(ObjectifBpf) objectifBpf?: ObjectifBpf;
  @IsOptional() @IsString() @MaxLength(8) codeNsf?: string | null;
  @IsOptional() @IsString() @MaxLength(30) codeCertification?: string | null;
}

export class CreneauDto {
  @IsDateString() debut!: string;
  @IsDateString() fin!: string;
  @IsOptional() @IsString() @MaxLength(160) intitule?: string;
  @IsOptional() @IsString() formateurId?: string | null;
  @IsOptional() @IsString() salleId?: string | null;
  @IsOptional() @IsBoolean() distanciel?: boolean;
}

export class ModifierCreneauDto extends PartialType(CreneauDto) {}

/** Une série de créneaux d'un coup : les jours et les deux demi-journées types. */
export class SerieCreneauxDto {
  @IsArray() @ArrayMaxSize(120) @IsDateString({}, { each: true }) jours!: string[];
  @IsOptional() @Matches(/^\d{2}:\d{2}$/) matinDebut?: string;
  @IsOptional() @Matches(/^\d{2}:\d{2}$/) matinFin?: string;
  @IsOptional() @Matches(/^\d{2}:\d{2}$/) apresMidiDebut?: string;
  @IsOptional() @Matches(/^\d{2}:\d{2}$/) apresMidiFin?: string;
  @IsOptional() @IsString() formateurId?: string | null;
  @IsOptional() @IsString() salleId?: string | null;
  @IsOptional() @IsBoolean() distanciel?: boolean;
}

/* ----------------------------------------------------------- stagiaires */

export class StagiaireDto {
  @IsString() @MinLength(2) @MaxLength(160) nom!: string;
  @IsOptional() @IsEmail({}, { message: "L'adresse e-mail du stagiaire n'est pas valide." }) email?: string;
  @IsOptional() @IsString() @MaxLength(30) telephone?: string;
  @IsOptional() @IsEnum(TypeStagiaire) typeStagiaire?: TypeStagiaire;
  @IsOptional() @IsEnum(FinancingType) financing?: FinancingType;
  @IsOptional() @IsEnum(OrigineFinancement) origineFinancement?: OrigineFinancement;
  @IsOptional() @IsString() @MaxLength(200) entrepriseNom?: string;
  @IsOptional() @IsString() @MaxLength(14) entrepriseSiret?: string;
  @IsOptional() @IsString() @MaxLength(300) entrepriseAdresse?: string;
  @IsOptional() @IsString() @MaxLength(160) entrepriseContact?: string;
  @IsOptional() @IsEmail({}, { message: "L'adresse e-mail de l'entreprise n'est pas valide." }) entrepriseEmail?: string;
  @IsOptional() @IsString() @MaxLength(160) financeurNom?: string;
  @IsOptional() @IsString() @MaxLength(80) numeroDossier?: string;
  @IsOptional() @IsNumber() @Min(0) prixHt?: number;
}

export class ModifierStagiaireDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(160) nom?: string;
  @IsOptional() @IsString() @MaxLength(200) email?: string | null;
  @IsOptional() @IsString() @MaxLength(30) telephone?: string | null;
  @IsOptional() @IsEnum(TypeStagiaire) typeStagiaire?: TypeStagiaire;
  @IsOptional() @IsEnum(FinancingType) financing?: FinancingType;
  @IsOptional() @IsEnum(OrigineFinancement) origineFinancement?: OrigineFinancement | null;
  @IsOptional() @IsString() @MaxLength(200) entrepriseNom?: string | null;
  @IsOptional() @IsString() @MaxLength(14) entrepriseSiret?: string | null;
  @IsOptional() @IsString() @MaxLength(300) entrepriseAdresse?: string | null;
  @IsOptional() @IsString() @MaxLength(160) entrepriseContact?: string | null;
  @IsOptional() @IsString() @MaxLength(200) entrepriseEmail?: string | null;
  @IsOptional() @IsString() @MaxLength(160) financeurNom?: string | null;
  @IsOptional() @IsString() @MaxLength(80) numeroDossier?: string | null;
  @IsOptional() @IsNumber() @Min(0) prixHt?: number | null;
  @IsOptional() @IsEnum(InscriptionStatus) status?: InscriptionStatus;
  @IsOptional() @IsString() @MaxLength(2000) evalResult?: string | null;
  @IsOptional() @IsString() @MaxLength(500) motifAbandon?: string | null;
}

/* ----------------------------------------------------------- émargement */

export class PresenceDto {
  @IsDateString() slotDate!: string;
  @IsIn(['MORNING', 'AFTERNOON']) slot!: 'MORNING' | 'AFTERNOON';
  @IsBoolean() present!: boolean;
}

export class OuvrirSeanceDto {
  @IsOptional() @IsDateString() slotDate?: string;
  @IsOptional() @IsIn(['MORNING', 'AFTERNOON']) slot?: 'MORNING' | 'AFTERNOON';
}

export class SignatureFormateurDto {
  @IsString() @MinLength(2) @MaxLength(120) nom!: string;
  @IsString() @MaxLength(20000) trace!: string;
}

export class SignatureStagiaireDto {
  @IsString() @Matches(/^\d{6}$/, { message: 'Le code affiché en salle compte six chiffres.' }) code!: string;
  @IsString() @MaxLength(20000) trace!: string;
}

/* ------------------------------------------------------------ documents */

export class EnvoiDocumentDto {
  @IsEnum(TypeDocumentSession) type!: TypeDocumentSession;
  /** Une inscription précise, ou toutes celles concernées par ce type. */
  @IsOptional() @IsString() inscriptionId?: string;
  /** Pour une convention : le client (entreprise) visé. */
  @IsOptional() @IsString() @MaxLength(200) entreprise?: string;
  /** Demander la signature électronique (conventions et contrats). */
  @IsOptional() @IsBoolean() aSigner?: boolean;
}

export class CodeSignatureDto {
  @IsString() @Matches(/^\d{6}$/, { message: 'Le code reçu par e-mail compte six chiffres.' }) code!: string;
}

export class RefusSignatureDto {
  @IsOptional() @IsString() @MaxLength(500) motif?: string;
}

/* ---------------------------------------------------------- évaluations */

export class PositionnementDto {
  @IsIn(['entree', 'sortie']) moment!: 'entree' | 'sortie';
  /** { "objectif": note de 0 à 4 } */
  @IsObject() notes!: Record<string, number>;
}

export class EvaluationStagiaireDto {
  @IsIn(['chaud', 'froid']) type!: 'chaud' | 'froid';
  @IsInt() @Min(1) @Max(5) note!: number;
  @IsOptional() @IsInt() @Min(1) @Max(5) objectifs?: number;
  @IsOptional() @IsInt() @Min(1) @Max(5) pedagogie?: number;
  @IsOptional() @IsInt() @Min(1) @Max(5) organisation?: number;
  @IsOptional() @IsBoolean() recommande?: boolean;
  @IsOptional() @IsIn(['OUI', 'PARTIELLEMENT', 'NON']) miseEnOeuvre?: 'OUI' | 'PARTIELLEMENT' | 'NON';
  @IsOptional() @IsString() @MaxLength(3000) commentaire?: string;
}

export class EvaluationCommanditaireDto {
  @IsInt() @Min(1) @Max(5) note!: number;
  @IsOptional() @IsIn(['OUI', 'PARTIELLEMENT', 'NON']) effets?: 'OUI' | 'PARTIELLEMENT' | 'NON';
  @IsOptional() @IsBoolean() recommande?: boolean;
  @IsOptional() @IsString() @MaxLength(3000) commentaire?: string;
}

/* ---------------------------------------------------------- facturation */

export class LigneFactureDto {
  @IsString() @MinLength(1) @MaxLength(300) libelle!: string;
  @IsNumber() @Min(0) @Max(100000) quantite!: number;
  @IsNumber() @Min(-1000000) @Max(1000000) prixUnitaireHt!: number;
  @IsNumber() @Min(0) @Max(100) tauxTva!: number;
}

export class ClientFactureDto {
  @IsString() @MinLength(2) @MaxLength(200) nom!: string;
  @IsOptional() @IsString() @MaxLength(300) adresse?: string;
  @IsOptional() @IsString() @MaxLength(10) codePostal?: string;
  @IsOptional() @IsString() @MaxLength(120) ville?: string;
  @IsOptional() @IsString() @MaxLength(14) siret?: string;
  @IsOptional() @IsString() @MaxLength(200) email?: string;
  @IsOptional() @IsString() @MaxLength(160) contact?: string;
  @IsIn(['ENTREPRISE', 'OPCO', 'PARTICULIER', 'PUBLIC', 'ORGANISME']) genre!: 'ENTREPRISE' | 'OPCO' | 'PARTICULIER' | 'PUBLIC' | 'ORGANISME';
}

export class FactureDto {
  @IsIn(['FACTURE', 'DEVIS']) type!: 'FACTURE' | 'DEVIS';
  @ValidateNested() @Type(() => ClientFactureDto) client!: ClientFactureDto;
  @IsArray() @ArrayMaxSize(60) @ValidateNested({ each: true }) @Type(() => LigneFactureDto) lignes!: LigneFactureDto[];
  @IsOptional() @IsString() sessionId?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(500) @IsString({ each: true }) inscriptionIds?: string[];
  @IsOptional() @IsEnum(OrigineFinancement) origineBpf?: OrigineFinancement;
  @IsOptional() @IsString() @MaxLength(80) numeroDossier?: string;
  @IsOptional() @IsString() @MaxLength(80) referenceClient?: string;
  @IsOptional() @IsDateString() echeance?: string;
  @IsOptional() @IsString() @MaxLength(1000) conditions?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}

export class ModifierFactureOrgDto {
  @IsOptional() @ValidateNested() @Type(() => ClientFactureDto) client?: ClientFactureDto;
  @IsOptional() @IsArray() @ArrayMaxSize(60) @ValidateNested({ each: true }) @Type(() => LigneFactureDto) lignes?: LigneFactureDto[];
  @IsOptional() @IsEnum(OrigineFinancement) origineBpf?: OrigineFinancement | null;
  @IsOptional() @IsString() @MaxLength(80) numeroDossier?: string | null;
  @IsOptional() @IsString() @MaxLength(80) referenceClient?: string | null;
  @IsOptional() @IsDateString() echeance?: string | null;
  @IsOptional() @IsString() @MaxLength(1000) conditions?: string | null;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string | null;
  @IsOptional() @IsBoolean() relancesActives?: boolean;
}

export class PaiementFactureDto {
  @IsNumber() @Min(0.01) montant!: number;
  @IsOptional() @IsDateString() date?: string;
}

export class AvoirDto {
  /** Vide : avoir total. Sinon, un montant HT partiel. */
  @IsOptional() @IsNumber() @Min(0.01) montantHt?: number;
  @IsOptional() @IsString() @MaxLength(300) motif?: string;
}

export class FacturerSessionDto {
  /** Une facture par entreprise (ou par financeur si subrogation), ou une seule. */
  @IsIn(['PAR_CLIENT', 'PAR_FINANCEUR', 'UNIQUE']) regroupement!: 'PAR_CLIENT' | 'PAR_FINANCEUR' | 'UNIQUE';
  @IsOptional() @IsIn(['FACTURE', 'DEVIS']) type?: 'FACTURE' | 'DEVIS';
}

/* ---------------------------------------------------------------- BPF */

export class SaisiesBpfDto {
  @IsObject() saisies!: Record<string, number | string | boolean | null>;
}

/* --------------------------------------------------------- réglages */

export class ReglagesAdministrationDto {
  @IsOptional() @IsString() @MaxLength(120) representantNom?: string | null;
  @IsOptional() @IsString() @MaxLength(120) representantQualite?: string | null;
  @IsOptional() @IsString() @MaxLength(20) numeroTva?: string | null;
  @IsOptional() @IsBoolean() exonereTva?: boolean;
  @IsOptional() @IsInt() @Min(0) @Max(30) tauxTva?: number;
  @IsOptional() @IsString() @MaxLength(300) coordonneesBancaires?: string | null;
  @IsOptional() @IsInt() @Min(0) @Max(90) delaiPaiementJours?: number;
  @IsOptional() @IsString() @MaxLength(500) reglementInterieurUrl?: string | null;
}

/* ------------------------------------------------------------ financements (prises en charge) */

const SIRET = /^\d{14}$/;

export class PriseEnChargeDto {
  @IsString() @MinLength(1) @MaxLength(160) entrepriseNom!: string;
  @IsOptional() @IsString() @Matches(SIRET, { message: 'Le SIRET compte quatorze chiffres.' }) entrepriseSiret?: string;
  @IsOptional() @IsString() @MaxLength(120) contactNom?: string;
  @IsOptional() @IsEmail({}, { message: "L'adresse e-mail n'est pas valide." }) contactEmail?: string;
  @IsOptional() @IsEnum(TypeFinanceur) financeur?: TypeFinanceur;
  @IsOptional() @IsString() @MaxLength(120) nomFinanceur?: string;
  @IsOptional() @IsString() @MaxLength(80) numeroDossier?: string;
  @IsOptional() @IsString() sessionId?: string;
  @IsOptional() @IsInt() @Min(1) @Max(10000) nbStagiaires?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(10000) heures?: number;
  @IsOptional() @IsInt() @Min(0) @Max(100_000_00) tarifHoraireCents?: number;
  /** Vide : stagiaires × heures × tarif horaire. */
  @IsOptional() @IsInt() @Min(0) @Max(1_000_000_000) montantDemandeCents?: number;
  @IsOptional() @IsInt() @Min(0) @Max(1_000_000_000) montantAccordeCents?: number;
  @IsOptional() @IsBoolean() salairesRembourses?: boolean;
  @IsOptional() @IsBoolean() subrogation?: boolean;
  @IsOptional() @IsDateString() dateDebutFormation?: string;
  /** Vide : début − 15 jours. */
  @IsOptional() @IsDateString() dateLimiteDepot?: string;
  @IsOptional() @IsDateString() dateFinFormation?: string;
  @IsOptional() @IsString() @MaxLength(4000) notes?: string;
  /** Le prospect gagné d'où vient ce dossier : il y est relié. */
  @IsOptional() @IsString() prospectId?: string;
}

export class ModifierPriseEnChargeDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(160) entrepriseNom?: string;
  @IsOptional() @IsString() @Matches(SIRET, { message: 'Le SIRET compte quatorze chiffres.' }) entrepriseSiret?: string | null;
  @IsOptional() @IsString() @MaxLength(120) contactNom?: string | null;
  @IsOptional() @IsEmail({}, { message: "L'adresse e-mail n'est pas valide." }) contactEmail?: string | null;
  @IsOptional() @IsEnum(TypeFinanceur) financeur?: TypeFinanceur;
  @IsOptional() @IsString() @MaxLength(120) nomFinanceur?: string | null;
  @IsOptional() @IsString() @MaxLength(80) numeroDossier?: string | null;
  @IsOptional() @IsString() sessionId?: string | null;
  @IsOptional() @IsInt() @Min(1) @Max(10000) nbStagiaires?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(10000) heures?: number;
  @IsOptional() @IsInt() @Min(0) @Max(100_000_00) tarifHoraireCents?: number;
  @IsOptional() @IsInt() @Min(0) @Max(1_000_000_000) montantDemandeCents?: number;
  @IsOptional() @IsInt() @Min(0) @Max(1_000_000_000) montantAccordeCents?: number | null;
  @IsOptional() @IsBoolean() salairesRembourses?: boolean | null;
  @IsOptional() @IsBoolean() subrogation?: boolean;
  @IsOptional() @IsDateString() dateDebutFormation?: string | null;
  @IsOptional() @IsDateString() dateLimiteDepot?: string | null;
  @IsOptional() @IsDateString() dateDepot?: string | null;
  @IsOptional() @IsDateString() dateAccord?: string | null;
  @IsOptional() @IsDateString() dateFinFormation?: string | null;
  @IsOptional() @IsDateString() dateFacturation?: string | null;
  @IsOptional() @IsDateString() datePaiement?: string | null;
  @IsOptional() @IsString() factureId?: string | null;
  @IsOptional() @IsString() @MaxLength(4000) notes?: string | null;
}

export class StatutPriseEnChargeDto {
  @IsEnum(StatutPriseEnCharge) statut!: StatutPriseEnCharge;
  /** La date de l'étape (dépôt, accord…). Vide : aujourd'hui. */
  @IsOptional() @IsDateString() date?: string;
}

export class PiecePriseEnChargeDto {
  @IsBoolean() cochee!: boolean;
}

/* ------------------------------------------------------------ prospects */

export class ProspectDto {
  @IsString() @MinLength(1) @MaxLength(160) nom!: string;
  @IsOptional() @IsString() @MaxLength(120) contactNom?: string;
  @IsOptional() @IsEmail({}, { message: "L'adresse e-mail n'est pas valide." }) contactEmail?: string;
  @IsOptional() @IsString() @MaxLength(30) telephone?: string;
  @IsOptional() @IsString() @MaxLength(80) source?: string;
  @IsOptional() @IsString() @MaxLength(200) besoin?: string;
  @IsOptional() @IsInt() @Min(0) @Max(1_000_000_000) montantEstimeCents?: number;
  @IsOptional() @IsEnum(EtapeProspect) etape?: EtapeProspect;
  @IsOptional() @IsString() @MaxLength(160) prochaineAction?: string;
  @IsOptional() @IsDateString() dateProchaineAction?: string;
  @IsOptional() @IsString() @MaxLength(4000) notes?: string;
}

export class ModifierProspectDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(160) nom?: string;
  @IsOptional() @IsString() @MaxLength(120) contactNom?: string | null;
  @IsOptional() @IsEmail({}, { message: "L'adresse e-mail n'est pas valide." }) contactEmail?: string | null;
  @IsOptional() @IsString() @MaxLength(30) telephone?: string | null;
  @IsOptional() @IsString() @MaxLength(80) source?: string | null;
  @IsOptional() @IsString() @MaxLength(200) besoin?: string | null;
  @IsOptional() @IsInt() @Min(0) @Max(1_000_000_000) montantEstimeCents?: number | null;
  @IsOptional() @IsString() @MaxLength(160) prochaineAction?: string | null;
  @IsOptional() @IsDateString() dateProchaineAction?: string | null;
  @IsOptional() @IsString() @MaxLength(4000) notes?: string | null;
  @IsOptional() @IsString() factureId?: string | null;
}

export class EtapeProspectDto {
  @IsEnum(EtapeProspect) etape!: EtapeProspect;
}
