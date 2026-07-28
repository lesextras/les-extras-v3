import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Champs éditables du User + Profile (fusion identité + données étendues). */
export class UpdateProfileDto {
  // --- User ---
  @IsOptional()
  @IsString()
  @MaxLength(80)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  /** Rendez-vous hebdomadaire du lundi : un e-mail par semaine, groupé. */
  @IsOptional()
  @IsBoolean()
  hebdoOptIn?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;

  /**
   * Identifiant du fichier déposé via /files. Prend le pas sur l'adresse web
   * saisie à la main : c'est le mode recommandé.
   */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  avatarFileId?: string;

  // --- Profile ---
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  job?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(20)
  siret?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  diplomaUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  postalCode?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(300)
  radiusKm?: number;

  /** Taux horaire (Decimal en base) — transmis en chaîne pour la précision. */
  @IsOptional()
  @IsNumberString()
  hourlyRate?: string;

  @IsOptional()
  @IsBoolean()
  available?: boolean;
}
