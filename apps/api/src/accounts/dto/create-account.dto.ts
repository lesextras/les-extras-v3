import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { AccountType } from '@prisma/client';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name!: string;

  @IsEnum(AccountType)
  type!: AccountType;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  legalName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  siret?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string;

  /** Mention de TVA affichée sur les factures émises par ce compte. */
  @IsOptional()
  @IsString()
  @MaxLength(300)
  vatMention?: string;

  /**
   * IBAN imprimé dans la section « Règlement » des factures émises par ce
   * compte. Facultatif : sans lui, le bloc de coordonnées n'est pas affiché —
   * on n'invente pas des coordonnées bancaires. Un IBAN fait au plus 34
   * caractères (norme ISO 13616) ; la marge couvre les espaces de lisibilité
   * que les gens saisissent naturellement.
   */
  @IsOptional()
  @IsString()
  @MaxLength(50)
  iban?: string;

  /** BIC de la banque (8 ou 11 caractères, norme ISO 9362). Facultatif. */
  @IsOptional()
  @IsString()
  @MaxLength(15)
  bic?: string;
}
