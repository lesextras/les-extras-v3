import {
  ArrayMaxSize,
  IsArray,
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
import { CibleDiffusion, MissionCategory, ModeAttribution } from '@prisma/client';

/** Mise à jour partielle d'une mission (tant qu'elle n'est pas clôturée). */
export class UpdateMissionDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

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

  @IsOptional()
  @IsISO8601()
  startDate?: string;

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
  @IsString()
  orgUnitId?: string;

  @IsOptional()
  @IsEnum(ModeAttribution)
  modeAttribution?: ModeAttribution;

  /**
   * Rouvrir une mission trop restreinte, ou au contraire la resserrer. Le
   * ciblage n'est retouché que si l'un de ces trois champs est envoyé.
   */
  @IsOptional()
  @IsEnum(CibleDiffusion)
  cibleDiffusion?: CibleDiffusion;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(500)
  destinatairesSalaries?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(500)
  destinatairesIntervenants?: string[];
}
