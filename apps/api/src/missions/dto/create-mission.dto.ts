import {
  IsIn,
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsNumber,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { MissionCategory } from '@prisma/client';

/**
 * Création d'une mission SOS Renfort par un ESTABLISHMENT.
 * La mission est créée en statut DRAFT ; la diffusion se fait via /publish.
 */
export class CreateMissionDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @IsString()
  @MinLength(10)
  description!: string;

  @IsOptional()
  @IsEnum(MissionCategory)
  category?: MissionCategory;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  job?: string;

  @IsISO8601()
  startDate!: string;

  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  hourlyRate?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  headcount?: number;

  @IsOptional()
  @IsBoolean()
  emergency?: boolean;

  /** 'HEBDO' : l'occurrence de la semaine suivante est creee et publiee automatiquement. */
  @IsOptional()
  @IsIn(['HEBDO'])
  recurrence?: string;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  /**
   * Identifiant du fichier déposé via /files. Prend le pas sur l'adresse web
   * saisie à la main : c'est le mode recommandé.
   */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  attachmentId?: string;

  @IsOptional()
  @IsString()
  orgUnitId?: string;
}
