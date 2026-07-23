import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ProofStatus } from '@prisma/client';

/** Dépôt / mise à jour d'une preuve Qualiopi pour un indicateur. */
export class UpsertProofDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  label?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  documentUrl?: string;

  @IsOptional()
  @IsEnum(ProofStatus)
  status?: ProofStatus;
}
