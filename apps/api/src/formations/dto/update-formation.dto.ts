import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { FormationStatus, FormationType } from '@prisma/client';

/** Mise à jour partielle d'un programme (tous champs optionnels). */
export class UpdateFormationDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  // Même règle qu'à la création : pas de titre fait de symboles.
  @Matches(/\p{L}{3}/u, { message: 'Le titre doit contenir au moins un mot (trois lettres qui se suivent).' })
  title?: string;

  @IsOptional()
  @IsEnum(FormationType)
  type?: FormationType;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  summary?: string;

  @IsOptional()
  @IsString()
  objectives?: string;

  @IsOptional()
  @IsString()
  prerequisites?: string;

  @IsOptional()
  @IsString()
  program?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  targetAudience?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationHours?: number;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsBoolean()
  cpfEligible?: boolean;

  @IsOptional()
  @IsBoolean()
  certifying?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  certificationName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  edofRef?: string;

  @IsOptional()
  @IsEnum(FormationStatus)
  status?: FormationStatus;
}
