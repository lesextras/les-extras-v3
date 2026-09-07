import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
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
import { EtatAction, EtatDossier, NiveauOrganisation, RoleContact } from '@prisma/client';

/**
 * L'inscription d'une association. Un seul écran : qui vous êtes, quelle
 * association, un mot de passe. Le SIREN est facultatif : s'il est donné, le
 * classeur est pré-rempli avant même le premier clic.
 */
export class InscriptionAssociationDto {
  @IsEmail({}, { message: 'Cette adresse e-mail ne semble pas valide.' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' })
  @MaxLength(72, { message: 'Le mot de passe ne peut dépasser 72 caractères.' })
  @Matches(/[A-Za-z]/, { message: 'Le mot de passe doit contenir au moins une lettre.' })
  @Matches(/[0-9]/, { message: 'Le mot de passe doit contenir au moins un chiffre.' })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'Votre prénom est nécessaire.' })
  @MaxLength(80)
  prenom!: string;

  @IsString()
  @IsNotEmpty({ message: 'Votre nom est nécessaire.' })
  @MaxLength(80)
  nom!: string;

  @IsString()
  @IsNotEmpty({ message: "Le nom de l'association est nécessaire." })
  @MaxLength(200)
  nomAssociation!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{9}$/, { message: 'Un numéro SIREN compte exactement neuf chiffres.' })
  siren?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  source?: string;
}

/** Ouvrir l'espace d'une association pour une personne qui a déjà un compte. */
export class OuvrirEspaceDto {
  @IsString()
  @IsNotEmpty({ message: "Le nom de l'association est nécessaire." })
  @MaxLength(200)
  nomAssociation!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{9}$/, { message: 'Un numéro SIREN compte exactement neuf chiffres.' })
  siren?: string;
}

export class RattacherOrganisationDto {
  @IsString()
  @Matches(/^\d{9}$/, { message: 'Un numéro SIREN compte exactement neuf chiffres.' })
  siren!: string;
}

export class ModifierOrganisationDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(200) nom?: string;
  @IsOptional() @IsString() @MaxLength(40) sigle?: string;
  @IsOptional() @IsString() @MaxLength(20) rna?: string;
  @IsOptional() @IsString() @MaxLength(14) siret?: string;
  @IsOptional() @IsString() @MaxLength(200) adresse?: string;
  @IsOptional() @IsString() @MaxLength(10) codePostal?: string;
  @IsOptional() @IsString() @MaxLength(120) commune?: string;
  @IsOptional() @IsEnum(NiveauOrganisation) niveau?: NiveauOrganisation;
  @IsOptional() @IsInt() @Min(1) @Max(12) moisClotureExercice?: number;
}

export class ModifierPieceDto {
  @IsOptional() @IsDateString() dateEmission?: string | null;
  @IsOptional() @IsDateString() dateExpiration?: string | null;
  @IsOptional() @IsInt() @Min(2000) @Max(2100) exercice?: number | null;
  @IsOptional() @IsString() @MaxLength(500) note?: string | null;
}

export class EtapeFaiteDto {
  @IsBoolean()
  faite!: boolean;
}

export class DossierDto {
  @IsOptional() @IsString() @MaxLength(40) dispositifCode?: string | null;
  @IsString() @IsNotEmpty({ message: 'Le financeur est nécessaire.' }) @MaxLength(160) financeur!: string;
  @IsString() @IsNotEmpty({ message: "L'intitulé est nécessaire." }) @MaxLength(200) intitule!: string;
  @IsOptional() @IsEnum(EtatDossier) etat?: EtatDossier;
  @IsOptional() @IsNumber() @Min(0) montantDemande?: number | null;
  @IsOptional() @IsNumber() @Min(0) montantAccorde?: number | null;
  @IsOptional() @IsDateString() dateLimiteDepot?: string | null;
  @IsOptional() @IsDateString() dateDepot?: string | null;
  @IsOptional() @IsDateString() dateDecision?: string | null;
  @IsOptional() @IsDateString() dateCompteRendu?: string | null;
  @IsOptional() @IsArray() @IsString({ each: true }) piecesExigees?: string[];
  @IsOptional() @IsString() @MaxLength(4000) notes?: string | null;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => LigneBudgetDto) budgetPrevu?: LigneBudgetDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => LigneBudgetDto) budgetRealise?: LigneBudgetDto[];
  @IsOptional() @IsString() @MaxLength(4000) bilanAction?: string | null;
  @IsOptional() @IsInt() @Min(0) nombreBeneficiaires?: number | null;
}

/** Une ligne de budget : ce que ça coûte, ou d'où vient l'argent. */
export class LigneBudgetDto {
  @IsString() @IsNotEmpty() @MaxLength(160) libelle!: string;
  @IsNumber() @Min(0) montant!: number;
  @IsIn(['DEPENSE', 'RECETTE']) sens!: 'DEPENSE' | 'RECETTE';
}

/** Le projet en une page : quatre questions, et ce qu'on demande. */
export class ProjetDto {
  @IsOptional() @IsString() @MaxLength(2000) pourQui?: string | null;
  @IsOptional() @IsString() @MaxLength(2000) quoi?: string | null;
  @IsOptional() @IsString() @MaxLength(2000) comment?: string | null;
  @IsOptional() @IsString() @MaxLength(2000) apres?: string | null;
  @IsOptional() @IsString() @MaxLength(1000) demande?: string | null;
}

/** La vie statutaire : la dernière assemblée générale, la durée des mandats. */
export class VieStatutaireDto {
  @IsOptional() @IsDateString() dateDerniereAG?: string | null;
  @IsOptional() @IsInt() @Min(1) @Max(120) dureeMandatMois?: number;
}

/** Une personne du répertoire : membre, bénévole, dirigeant, partenaire, financeur. */
export class ContactDto {
  @IsString() @IsNotEmpty() @MaxLength(80) prenom!: string;
  @IsString() @IsNotEmpty() @MaxLength(80) nom!: string;
  @IsOptional() @IsEmail() email?: string | null;
  @IsOptional() @IsString() @MaxLength(40) telephone?: string | null;
  @IsOptional() @IsString() @MaxLength(160) structure?: string | null;
  @IsOptional() @IsArray() @IsEnum(RoleContact, { each: true }) roles?: RoleContact[];
  @IsOptional() @IsDateString() dateAdhesion?: string | null;
  @IsOptional() @IsBoolean() cotisationAJour?: boolean;
  @IsOptional() @IsDateString() mandatDebut?: string | null;
  @IsOptional() @IsDateString() mandatFin?: string | null;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string | null;
}

export class ModifierContactDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(80) prenom?: string;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(80) nom?: string;
  @IsOptional() @IsEmail() email?: string | null;
  @IsOptional() @IsString() @MaxLength(40) telephone?: string | null;
  @IsOptional() @IsString() @MaxLength(160) structure?: string | null;
  @IsOptional() @IsArray() @IsEnum(RoleContact, { each: true }) roles?: RoleContact[];
  @IsOptional() @IsDateString() dateAdhesion?: string | null;
  @IsOptional() @IsBoolean() cotisationAJour?: boolean;
  @IsOptional() @IsDateString() mandatDebut?: string | null;
  @IsOptional() @IsDateString() mandatFin?: string | null;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string | null;
}

/** Un document libre : un titre, une catégorie, un fichier. */
export class DocumentDto {
  @IsString() @IsNotEmpty() @MaxLength(160) titre!: string;
  @IsOptional() @IsString() @MaxLength(60) categorie?: string;
  @IsOptional() @IsString() @MaxLength(1000) note?: string;
}

export class ModifierDossierDto {
  @IsOptional() @IsString() @MaxLength(40) dispositifCode?: string | null;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(160) financeur?: string;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(200) intitule?: string;
  @IsOptional() @IsEnum(EtatDossier) etat?: EtatDossier;
  @IsOptional() @IsNumber() @Min(0) montantDemande?: number | null;
  @IsOptional() @IsNumber() @Min(0) montantAccorde?: number | null;
  @IsOptional() @IsDateString() dateLimiteDepot?: string | null;
  @IsOptional() @IsDateString() dateDepot?: string | null;
  @IsOptional() @IsDateString() dateDecision?: string | null;
  @IsOptional() @IsDateString() dateCompteRendu?: string | null;
  @IsOptional() @IsArray() @IsString({ each: true }) piecesExigees?: string[];
  @IsOptional() @IsString() @MaxLength(4000) notes?: string | null;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => LigneBudgetDto) budgetPrevu?: LigneBudgetDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => LigneBudgetDto) budgetRealise?: LigneBudgetDto[];
  @IsOptional() @IsString() @MaxLength(4000) bilanAction?: string | null;
  @IsOptional() @IsInt() @Min(0) nombreBeneficiaires?: number | null;
}

/** Fabriquer un document : les valeurs du formulaire, et le format voulu. */
export class FabriqueDto {
  @IsObject() valeurs!: Record<string, unknown>;
  @IsOptional() @IsIn(['pdf', 'docx']) format?: 'pdf' | 'docx';
}

/** Une action de l'association : ce qu'elle fait sur le terrain. */
export class ActionDto {
  @IsString() @IsNotEmpty({ message: "L'intitulé de l'action est nécessaire." }) @MaxLength(200) intitule!: string;
  @IsOptional() @IsString() @MaxLength(2000) resume?: string | null;
  @IsOptional() @IsString() @MaxLength(160) lieu?: string | null;
  @IsOptional() @IsDateString() dateDebut?: string | null;
  @IsOptional() @IsDateString() dateFin?: string | null;
  @IsOptional() @IsEnum(EtatAction) etat?: EtatAction;
  @IsOptional() @IsInt() @Min(0) @Max(1000000) beneficiaires?: number | null;
  @IsOptional() @IsInt() @Min(0) @Max(100000) benevoles?: number | null;
  @IsOptional() @IsInt() @Min(0) @Max(1000000) heuresBenevoles?: number | null;
  @IsOptional() @IsInt() @Min(0) @Max(100000000) cout?: number | null;
  @IsOptional() @IsString() @MaxLength(400) partenaires?: string | null;
  @IsOptional() @IsString() @MaxLength(4000) bilan?: string | null;
}

export class ModifierActionDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(200) intitule?: string;
  @IsOptional() @IsString() @MaxLength(2000) resume?: string | null;
  @IsOptional() @IsString() @MaxLength(160) lieu?: string | null;
  @IsOptional() @IsDateString() dateDebut?: string | null;
  @IsOptional() @IsDateString() dateFin?: string | null;
  @IsOptional() @IsEnum(EtatAction) etat?: EtatAction;
  @IsOptional() @IsInt() @Min(0) @Max(1000000) beneficiaires?: number | null;
  @IsOptional() @IsInt() @Min(0) @Max(100000) benevoles?: number | null;
  @IsOptional() @IsInt() @Min(0) @Max(1000000) heuresBenevoles?: number | null;
  @IsOptional() @IsInt() @Min(0) @Max(100000000) cout?: number | null;
  @IsOptional() @IsString() @MaxLength(400) partenaires?: string | null;
  @IsOptional() @IsString() @MaxLength(4000) bilan?: string | null;
}
