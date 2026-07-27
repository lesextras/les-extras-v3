import { IsEnum, IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';
import { ComplianceDocType, ComplianceStatus } from '@prisma/client';

/** Dépôt / mise à jour d'une pièce de conformité pour un intervenant. */
export class UpsertComplianceDto {
  @IsEnum(ComplianceDocType)
  type!: ComplianceDocType;

  @IsOptional()
  @IsEnum(ComplianceStatus)
  status?: ComplianceStatus;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  label?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  fileUrl?: string;

  /**
   * Identifiant du fichier déposé via /files. Prend le pas sur l'adresse web
   * saisie à la main : c'est le mode recommandé.
   */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  fileId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  /** Date d'émission (ISO 8601, ex : casier judiciaire, permis). */
  @IsOptional()
  @IsISO8601()
  issuedAt?: string;

  /** Date d'échéance / de fin de validité (ISO 8601). */
  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}
