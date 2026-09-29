import { ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { StatutFactureFournisseur, StatutNoteDeFrais, TypeEnveloppe } from '@prisma/client';

export class DeposerFactureDto {
  @IsOptional() @IsString() @MaxLength(80) poste?: string;
  @IsOptional() @IsString() @MaxLength(40) enveloppeId?: string;
}

export class SaisirFactureDto {
  @IsString() @MaxLength(120) fournisseur!: string;
  @Type(() => Number) @IsNumber() @Min(0) montantTTC!: number;
  @IsOptional() @IsString() @MaxLength(10) dateFacture?: string;
  @IsOptional() @IsString() @MaxLength(80) poste?: string;
  @IsOptional() @IsString() @MaxLength(60) numero?: string;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
  @IsOptional() @IsString() @MaxLength(40) enveloppeId?: string | null;
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
  @IsOptional() @IsString() @MaxLength(40) enveloppeId?: string | null;
  @IsOptional() @IsBoolean() accepterRib?: boolean;
}

export class AbonnerDto {
  /** L'espace d'où l'on vient : le retour Stripe y ramène. */
  @IsIn(['association', 'academie']) espace!: 'association' | 'academie';
}

export class EnveloppeDto {
  @IsString() @MaxLength(120) nom!: string;
  @IsOptional() @IsEnum(TypeEnveloppe) type?: TypeEnveloppe;
  @IsOptional() @IsString() @MaxLength(120) financeur?: string | null;
  @IsOptional() @Type(() => Number) @IsNumber() montantAccorde?: number | null;
  @IsOptional() @IsString() @MaxLength(10) dateDebut?: string | null;
  @IsOptional() @IsString() @MaxLength(10) dateFin?: string | null;
  @IsOptional() @IsString() @MaxLength(10) dateJustification?: string | null;
  @IsOptional() @IsString() @MaxLength(10) dateVersementPrevu?: string | null;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string | null;
  @IsOptional() @IsString() @MaxLength(40) dossierId?: string | null;
  @IsOptional() @IsString() @MaxLength(40) actionId?: string | null;
  @IsOptional() @IsString() @MaxLength(40) coursId?: string | null;
}

export class ModifierEnveloppeDto {
  @IsOptional() @IsString() @MaxLength(120) nom?: string;
  @IsOptional() @IsEnum(TypeEnveloppe) type?: TypeEnveloppe;
  @IsOptional() @IsString() @MaxLength(120) financeur?: string | null;
  @IsOptional() @Type(() => Number) @IsNumber() montantAccorde?: number | null;
  @IsOptional() @IsString() @MaxLength(10) dateDebut?: string | null;
  @IsOptional() @IsString() @MaxLength(10) dateFin?: string | null;
  @IsOptional() @IsString() @MaxLength(10) dateJustification?: string | null;
  @IsOptional() @IsString() @MaxLength(10) dateVersementPrevu?: string | null;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string | null;
}

export class ModifierOperationDto {
  @IsOptional() @IsString() @MaxLength(80) poste?: string | null;
  @IsOptional() @IsString() @MaxLength(40) enveloppeId?: string | null;
  @IsOptional() @IsString() @MaxLength(40) factureId?: string | null;
}

export class NoteDeFraisDto {
  @IsString() @MaxLength(120) beneficiaire!: string;
  @IsString() @MaxLength(10) date!: string;
  @IsString() @MaxLength(300) objet!: string;
  @Type(() => Number) @IsNumber() @Min(0.01) montant!: number;
  @IsOptional() @IsString() @MaxLength(80) poste?: string | null;
  @IsOptional() @IsString() @MaxLength(40) enveloppeId?: string | null;
  @IsOptional() @Type(() => Boolean) @IsBoolean() abandon?: boolean;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string | null;
}

export class StatutNoteDto {
  @IsEnum(StatutNoteDeFrais) statut!: StatutNoteDeFrais;
}

export class ReglagesDto {
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) seuilDoubleValidation?: number | null;
  /** Le solde du compte en banque à une date : point de départ de la trésorerie prévisionnelle. */
  @IsOptional() @Type(() => Number) @IsNumber() soldeBancaire?: number | null;
  @IsOptional() @IsString() @MaxLength(10) soldeBancaireAu?: string | null;
}

export class DeposerDevisDto {
  @IsOptional() @IsString() @MaxLength(80) poste?: string;
}

export class SaisirDevisDto {
  @IsString() @MaxLength(120) fournisseur!: string;
  @Type(() => Number) @IsNumber() @Min(0) montantTTC!: number;
  @IsOptional() @IsString() @MaxLength(60) reference?: string;
  @IsOptional() @IsString() @MaxLength(10) dateDevis?: string;
  @IsOptional() @IsString() @MaxLength(10) dateValidite?: string;
  @IsOptional() @IsString() @MaxLength(80) poste?: string;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}

export class ModifierDevisDto {
  @IsOptional() @IsString() @MaxLength(120) fournisseur?: string;
  @IsOptional() @IsString() @MaxLength(60) reference?: string | null;
  @IsOptional() @IsString() @MaxLength(10) dateDevis?: string | null;
  @IsOptional() @IsString() @MaxLength(10) dateValidite?: string | null;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) montantTTC?: number;
  @IsOptional() @IsString() @MaxLength(80) poste?: string | null;
  @IsOptional() @IsIn(['EN_ATTENTE', 'ANNULE']) statut?: 'EN_ATTENTE' | 'ANNULE';
  @IsOptional() @IsString() @MaxLength(1000) notes?: string | null;
  @IsOptional() @IsString() @MaxLength(40) factureId?: string | null;
}

/* ─── Prévu / réalisé d'une subvention ─── */

export class LigneBudgetDto {
  @IsString() @MaxLength(6) code!: string;
  @IsString() @MaxLength(160) libelle!: string;
  @IsOptional() @Type(() => Number) @IsNumber() prevu?: number | null;
  @IsOptional() @Type(() => Number) @IsNumber() realiseManuel?: number | null;
  @IsOptional() @IsString() @MaxLength(500) commentaire?: string | null;
}

export class ObjectifDto {
  @IsString() @MaxLength(300) intitule!: string;
  @IsOptional() @IsString() @MaxLength(300) indicateur?: string | null;
  @IsOptional() @Type(() => Number) @IsNumber() cible?: number | null;
  @IsOptional() @IsString() @MaxLength(40) unite?: string | null;
  @IsOptional() @Type(() => Number) @IsNumber() realise?: number | null;
  @IsOptional() @IsString() @MaxLength(500) commentaire?: string | null;
}

export class PublicDto {
  @IsString() @MaxLength(200) categorie!: string;
  @IsOptional() @Type(() => Number) @IsNumber() prevu?: number | null;
  @IsOptional() @Type(() => Number) @IsNumber() realise?: number | null;
  @IsOptional() @IsString() @MaxLength(500) commentaire?: string | null;
}

export class SaisirPrevisionnelDto {
  @IsOptional() @IsString() @MaxLength(200) intitule?: string | null;
  @IsOptional() @IsString() @MaxLength(10) periodeDebut?: string | null;
  @IsOptional() @IsString() @MaxLength(10) periodeFin?: string | null;
  @IsOptional() @IsArray() @ArrayMaxSize(80) @ValidateNested({ each: true }) @Type(() => LigneBudgetDto) charges?: LigneBudgetDto[];
  @IsOptional() @IsArray() @ArrayMaxSize(80) @ValidateNested({ each: true }) @Type(() => LigneBudgetDto) produits?: LigneBudgetDto[];
  @IsOptional() @IsArray() @ArrayMaxSize(40) @ValidateNested({ each: true }) @Type(() => ObjectifDto) objectifs?: ObjectifDto[];
  @IsOptional() @IsArray() @ArrayMaxSize(30) @ValidateNested({ each: true }) @Type(() => PublicDto) publics?: PublicDto[];
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) seuilEcart?: number;
}
