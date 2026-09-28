import { IsEnum, IsIn, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { StatutFactureFournisseur } from '@prisma/client';

export class DeposerFactureDto {
  @IsOptional() @IsString() @MaxLength(80) poste?: string;
}

export class SaisirFactureDto {
  @IsString() @MaxLength(120) fournisseur!: string;
  @Type(() => Number) @IsNumber() @Min(0) montantTTC!: number;
  @IsOptional() @IsString() @MaxLength(10) dateFacture?: string;
  @IsOptional() @IsString() @MaxLength(80) poste?: string;
  @IsOptional() @IsString() @MaxLength(60) numero?: string;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}

export class ModifierFactureDto {
  @IsOptional() @IsString() @MaxLength(120) fournisseur?: string;
  @IsOptional() @IsString() @MaxLength(60) numero?: string;
  @IsOptional() @IsString() @MaxLength(10) dateFacture?: string | null;
  @IsOptional() @IsString() @MaxLength(10) dateEcheance?: string | null;
  @IsOptional() @Type(() => Number) @IsNumber() montantHT?: number | null;
  @IsOptional() @Type(() => Number) @IsNumber() tva?: number | null;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) montantTTC?: number;
  @IsOptional() @IsString() @MaxLength(80) poste?: string | null;
  @IsOptional() @IsEnum(StatutFactureFournisseur) statut?: StatutFactureFournisseur;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string | null;
}

export class AbonnerDto {
  /** L'espace d'où l'on vient : le retour Stripe y ramène. */
  @IsIn(['association', 'academie']) espace!: 'association' | 'academie';
}
