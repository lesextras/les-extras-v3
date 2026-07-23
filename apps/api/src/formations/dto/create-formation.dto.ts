import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { FormationType } from '@prisma/client';

/** Création d'un programme de formation (statut DRAFT). */
export class CreateFormationDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

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
}
