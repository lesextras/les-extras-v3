import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NatureProduit, StatutCommande, StatutProduit } from '@prisma/client';

/** La vitrine de la boutique. */
export class BoutiqueDto {
  @IsOptional() @IsString() @MaxLength(120) nom?: string;
  /// L'adresse publique, choisie par l'association. Normalisee cote service :
  /// ce qui arrive ici est ce que la personne a tape, pas ce qui sera retenu.
  @IsOptional() @IsString() @MaxLength(60) slug?: string;
  @IsOptional() @IsString() @MaxLength(160) sousTitre?: string;
  @IsOptional() @IsString() @MaxLength(4000) presentation?: string;
  @IsOptional() @IsString() @MaxLength(500) logoUrl?: string;
  @IsOptional() @IsString() @MaxLength(500) banniereUrl?: string;
  @IsOptional() @IsString() @MaxLength(9) couleur?: string;
  @IsOptional() @IsString() @MaxLength(160) contactEmail?: string;
  @IsOptional() @IsString() @MaxLength(20000) cgv?: string;
  @IsOptional() @IsString() @MaxLength(20000) mentions?: string;
  @IsOptional() @IsString() @MaxLength(2000) livraisonTexte?: string;
  @IsOptional() @IsBoolean() publiee?: boolean;
}

/** Un produit, à la création comme à la modification. */
export class ProduitDto {
  @IsOptional() @IsString() @MaxLength(160) titre?: string;
  @IsOptional() @IsString() @MaxLength(160) slug?: string;
  @IsOptional() @IsString() @MaxLength(8000) description?: string;
  @IsOptional() @IsString() @MaxLength(500) imageUrl?: string;
  @IsOptional() @IsEnum(NatureProduit) nature?: NatureProduit;
  @IsOptional() @IsInt() @Min(0) prixCents?: number;
  @IsOptional() @IsInt() @Min(0) prixBarreCents?: number;
  @IsOptional() @IsInt() @Min(0) @Max(100) tvaPourcent?: number;
  @IsOptional() @IsInt() @Min(0) stock?: number;
  @IsOptional() @IsInt() @Min(0) livraisonCents?: number;
  @IsOptional() @IsString() @MaxLength(500) fichierUrl?: string;
  @IsOptional() @IsString() @MaxLength(500) lienUrl?: string;
  @IsOptional() @IsEnum(StatutProduit) statut?: StatutProduit;
  @IsOptional() @IsInt() ordre?: number;
}

/** Ce que l'association change sur une commande déjà payée. */
export class SuiviCommandeDto {
  @IsOptional() @IsEnum(StatutCommande) statut?: StatutCommande;
  @IsOptional() @IsString() @MaxLength(2000) note?: string;
}

/** Une ligne du panier envoyée par la boutique publique. */
export class LignePanierDto {
  @IsString() produitId!: string;
  @IsOptional() @IsInt() @Min(1) @Max(50) quantite?: number;
}

/** La commande, telle qu'un visiteur la passe. */
export class CommanderDto {
  @IsEmail({}, { message: "Cette adresse e-mail n'est pas valide." }) email!: string;
  @IsOptional() @IsString() @MaxLength(120) nom?: string;
  @IsOptional() @IsString() @MaxLength(40) telephone?: string;
  @IsOptional() @IsString() @MaxLength(200) adresse?: string;
  @IsOptional() @IsString() @MaxLength(12) codePostal?: string;
  @IsOptional() @IsString() @MaxLength(120) ville?: string;
  @IsOptional() @IsString() @MaxLength(80) pays?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => LignePanierDto)
  lignes!: LignePanierDto[];
}
