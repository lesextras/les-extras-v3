import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

/** Une ligne de devis : libellé, quantité, prix unitaire TTC. */
export class QuoteLineDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  label!: string;

  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;
}

/** Demande de devis émise par un établissement. */
export class CreateQuoteRequestDto {
  @IsOptional()
  @IsString()
  serviceId?: string;

  @IsOptional()
  @IsString()
  providerAccountId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  request?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

/** Chiffrage envoyé par l'intervenant. */
export class SendQuoteDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteLineDto)
  lines!: QuoteLineDto[];

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  message?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;
}

export class RefuseQuoteDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
