import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { FinancingType } from '@prisma/client';

/** Inscrire un apprenant (membre identifié OU externe décrit en clair). */
export class CreateInscriptionDto {
  /** Apprenant utilisateur (membre). Sinon renseigner learnerName/Email. */
  @IsOptional()
  @IsString()
  learnerId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  learnerName?: string;

  @IsOptional()
  @IsEmail()
  learnerEmail?: string;

  @IsOptional()
  @IsEnum(FinancingType)
  financing?: FinancingType;
}
