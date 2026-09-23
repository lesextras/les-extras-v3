import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StatutRendu } from '@prisma/client';

/* ═══════════════════════════════════════════════════ L'ESPACE APPRENANT ══ */

export class DemanderLienDto {
  @IsEmail({}, { message: "Cette adresse e-mail n'est pas valide." }) @MaxLength(200) email!: string;
}

export class ConnexionApprenantDto {
  @IsEmail({}, { message: "Cette adresse e-mail n'est pas valide." }) @MaxLength(200) email!: string;
  @IsString() @MinLength(1) @MaxLength(200) motDePasse!: string;
}

export class ChoisirMotDePasseDto {
  @IsString() @MinLength(10) @MaxLength(100) jeton!: string;
  @IsString() @MinLength(8, { message: 'Le mot de passe doit faire au moins 8 caractères.' }) @MaxLength(200) motDePasse!: string;
}

export class ProfilApprenantDto {
  @IsOptional() @IsString() @MaxLength(120) prenom?: string;
  @IsOptional() @IsString() @MaxLength(120) nom?: string;
}

export class ChangerMotDePasseDto {
  @IsString() @MaxLength(200) actuel!: string;
  @IsString() @MinLength(8, { message: 'Le mot de passe doit faire au moins 8 caractères.' }) @MaxLength(200) nouveau!: string;
}

/* ════════════════════════════════════════════════════════ LES DEVOIRS ══ */

export class RenduDto {
  @IsOptional() @IsString() @MaxLength(20000) texte?: string;
}

export class CorrigerRenduDto {
  @IsEnum(StatutRendu) statut!: StatutRendu;
  @IsOptional() @ValidateIf((_, v) => v !== null) @Type(() => Number) @IsInt() @Min(0) @Max(100) note?: number | null;
  @IsOptional() @IsString() @MaxLength(5000) commentaire?: string;
}

/* ═════════════════════════════════════════════ LES COURRIELS AUTOMATIQUES ══ */

export class ModeleEmailDto {
  @IsOptional() @IsBoolean() actif?: boolean;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(200) sujet?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(8000) corps?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(525600) delaiMinutes?: number;
}

export class TesterEmailDto {
  @IsEmail({}, { message: "Cette adresse e-mail n'est pas valide." }) @MaxLength(200) email!: string;
}

/* ═════════════════════════════════════════════════════ LE CALENDRIER ══ */

export class EvenementDto {
  @IsString() @MinLength(2, { message: "Donne un titre à l'événement." }) @MaxLength(200) titre!: string;
  @IsOptional() @IsString() @MaxLength(4000) description?: string;
  @IsDateString({}, { message: 'Indique la date et l’heure de début.' }) debut!: string;
  @IsOptional() @ValidateIf((_, v) => v !== null && v !== '') @IsDateString() fin?: string | null;
  @IsOptional() @IsString() @MaxLength(300) lieu?: string;
  @IsOptional() @IsString() @MaxLength(500) lien?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) coursIds?: string[];
}

export class ModifierEvenementDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(200) titre?: string;
  @IsOptional() @IsString() @MaxLength(4000) description?: string;
  @IsOptional() @IsDateString() debut?: string;
  @IsOptional() @ValidateIf((_, v) => v !== null && v !== '') @IsDateString() fin?: string | null;
  @IsOptional() @IsString() @MaxLength(300) lieu?: string;
  @IsOptional() @IsString() @MaxLength(500) lien?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) coursIds?: string[];
}

/* ════════════════════════════════════════════════════ LA COMMUNAUTÉ ══ */

export class CollectionDto {
  @IsString() @MinLength(2, { message: 'Donne un nom à la collection.' }) @MaxLength(120) titre!: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) ordre?: number;
}

export class EspaceCommunauteDto {
  @IsOptional() @IsString() @MinLength(2, { message: "Donne un nom à l'espace." }) @MaxLength(120) titre?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsString() @MaxLength(8) icone?: string;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() collectionId?: string | null;
  @IsOptional() @IsArray() @IsString({ each: true }) coursIds?: string[];
  @IsOptional() @IsBoolean() ecritureApprenants?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) ordre?: number;
}

export class PublicationDto {
  @IsOptional() @IsString() @MaxLength(200) titre?: string;
  @IsString() @MinLength(1, { message: 'Écris quelque chose avant de publier.' }) @MaxLength(10000) texte!: string;
  @IsOptional() @IsBoolean() epinglee?: boolean;
}

export class ModererPublicationDto {
  @IsOptional() @IsBoolean() epinglee?: boolean;
  @IsOptional() @IsBoolean() masquee?: boolean;
}

export class CommentaireCommunauteDto {
  @IsString() @MinLength(1, { message: 'Le commentaire est vide.' }) @MaxLength(4000) texte!: string;
}

export class ModererCommentaireDto {
  @IsBoolean() masque!: boolean;
}

/* ═══════════════════════════════════════════════════════ LES RÉGLAGES ══ */

export class ReglagesEcoleDto {
  @IsOptional() @ValidateIf((_, v) => v !== null && v !== '') @IsString() @MaxLength(200) domaine?: string | null;
  @IsOptional() @IsString() @MaxLength(70) seoTitre?: string;
  @IsOptional() @IsString() @MaxLength(170) seoDescription?: string;
  @IsOptional() @IsBoolean() indexable?: boolean;
  @IsOptional() @IsString() @MaxLength(60000) cgu?: string;
  @IsOptional() @IsString() @MaxLength(60000) confidentialite?: string;
  @IsOptional() @IsBoolean() calendrierVisible?: boolean;
  @IsOptional() @IsBoolean() communauteActive?: boolean;
  @IsOptional() @IsString() @MaxLength(2000) communauteDescription?: string;
}

export class ReglageCoursDto {
  @IsOptional() @ValidateIf((_, v) => v !== null) @Type(() => Number) @IsInt() @Min(1) @Max(3650) dureeAccesJours?: number | null;
}

export class CleApiDto {
  @IsString() @MinLength(2, { message: 'Donne un nom à la clé (à quoi elle sert).' }) @MaxLength(80) nom!: string;
}

/* ═════════════════════════════════════════════ L'API POUR DÉVELOPPEURS ══ */

export class InscriptionApiDto {
  @IsString() @MaxLength(60) coursId!: string;
  @IsEmail({}, { message: "Cette adresse e-mail n'est pas valide." }) @MaxLength(200) email!: string;
  @IsOptional() @IsString() @MaxLength(120) prenom?: string;
  @IsOptional() @IsString() @MaxLength(120) nom?: string;
}

export class RejoindreClasseDto {
  @IsOptional() @IsString() @MaxLength(80) animateur?: string;
  @IsOptional() @IsString() @MaxLength(80) jeton?: string;
  @IsOptional() @IsString() @MaxLength(60) prenom?: string;
}
