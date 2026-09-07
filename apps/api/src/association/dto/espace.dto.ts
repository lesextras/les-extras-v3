import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { EtatDossier, NiveauOrganisation } from '@prisma/client';

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
}
