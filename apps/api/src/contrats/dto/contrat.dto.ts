import {
  IsBoolean,
  IsIn,
  IsISO8601,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const MOTIFS = [
  'REMPLACEMENT_SALARIE_ABSENT',
  'REMPLACEMENT_ATTENTE_ENTREE',
  'REMPLACEMENT_POSTE_SUPPRIME',
  'ACCROISSEMENT_TEMPORAIRE',
] as const;

export class CreateContratDto {
  @IsString() userId!: string;

  @IsIn(MOTIFS as unknown as string[])
  motif!: (typeof MOTIFS)[number];

  @IsOptional() @IsString() @MaxLength(160) salarieRemplaceNom?: string;
  @IsOptional() @IsString() @MaxLength(160) salarieRemplaceQualification?: string;

  @IsISO8601() dateDebut!: string;
  @IsOptional() @IsISO8601() dateFin?: string;
  @IsOptional() @IsInt() @Min(1) dureeMinimaleJours?: number;

  @IsOptional() @IsString() @MaxLength(160) poste?: string;
  @IsOptional() @IsString() @MaxLength(160) qualification?: string;
  @IsOptional() @IsBoolean() posteARisques?: boolean;
  @IsOptional() @IsString() @MaxLength(160) conventionCollective?: string;
  @IsOptional() @IsNumber() @Min(0) remunerationBrute?: number;
  @IsOptional() @IsString() @MaxLength(1000) remunerationDetail?: string;
  @IsOptional() @IsString() @MaxLength(200) caisseRetraiteComplementaire?: string;
  @IsOptional() @IsString() @MaxLength(200) organismePrevoyance?: string;

  @IsOptional() @IsString() missionId?: string;
}

export class UpdateContratDto extends CreateContratDto {
  @IsOptional() @IsString() declare userId: string;
  @IsOptional() @IsIn(MOTIFS as unknown as string[]) declare motif: (typeof MOTIFS)[number];
  @IsOptional() @IsISO8601() declare dateDebut: string;
}

export class DpaeDto {
  @IsISO8601() effectueeLe!: string;
  @IsOptional() @IsString() @MaxLength(120) reference?: string;
}

export class TerminerDto {
  @IsIn(['TERME_NORMAL', 'REFUS_CDI', 'RUPTURE_SALARIE', 'FAUTE_GRAVE', 'FORCE_MAJEURE'])
  cause!: 'TERME_NORMAL' | 'REFUS_CDI' | 'RUPTURE_SALARIE' | 'FAUTE_GRAVE' | 'FORCE_MAJEURE';

  /** Rémunération brute totale réellement versée, base de l'indemnité. */
  @IsOptional() @IsNumber() @Min(0) remunerationBruteTotale?: number;

  @IsOptional() @IsString() @MinLength(3) @MaxLength(500) commentaire?: string;
}
