import { IsArray, IsBoolean, IsDateString, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { StatutFormulaire } from '@prisma/client';

/**
 * Les questions ne sont pas validées par class-validator : leur forme change
 * d'un champ à l'autre. Elles passent par `nettoyerChamps()`, qui corrige ce
 * qui peut l'être et jette ce qui n'a pas de libellé.
 */
export class CreerFormulaireDto {
  @IsString()
  @MinLength(2, { message: 'Donne un titre à ton formulaire.' })
  @MaxLength(200)
  titre!: string;

  @IsOptional() @IsString() @MaxLength(4000) introduction?: string;
  @IsOptional() @IsArray() champs?: unknown[];
}

export class ModifierFormulaireDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(200) titre?: string;
  @IsOptional() @IsString() @MaxLength(4000) introduction?: string;
  @IsOptional() @IsArray() champs?: unknown[];
  @IsOptional() @IsString() @MaxLength(2000) remerciement?: string;
  @IsOptional() @IsBoolean() reponseUnique?: boolean;
  @IsOptional() @IsBoolean() demanderEmail?: boolean;
  @IsOptional() @IsDateString({}, { message: "Cette date n'est pas valide." }) fermeLe?: string;
  @IsOptional() @IsEnum(StatutFormulaire, { message: "Cet état n'existe pas." }) statut?: StatutFormulaire;
  /** L'adresse publique. On la nettoie côté service ; ici on borne la longueur. */
  @IsOptional() @IsString() @MinLength(3) @MaxLength(60) slug?: string;
}

/** Ce qu'envoie la page publique. Les valeurs sont relues par `verifierReponse`. */
export class RepondreDto {
  @IsOptional() @IsString() @MaxLength(200) email?: string;
  valeurs?: unknown;
}
