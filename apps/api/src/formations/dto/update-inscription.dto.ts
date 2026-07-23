import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { InscriptionStatus } from '@prisma/client';

export class UpdateInscriptionDto {
  @IsOptional()
  @IsEnum(InscriptionStatus)
  status?: InscriptionStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  satisfaction?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  evalResult?: string;
}
