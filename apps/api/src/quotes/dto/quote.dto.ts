import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

/**
 * UNE LIGNE DE DEVIS.
 *
 * `unitPrice` s'entend désormais HORS TAXES. Le changement est sans effet sur
 * les devis déjà envoyés : la TVA y valait zéro pour tout le monde — franchise
 * en base pour les intervenants indépendants (art. 293 B du CGI), association
 * non assujettie pour ADéPA — donc le hors taxes y égalait le toutes taxes.
 * Le champ garde son nom pour ne pas invalider le JSON déjà stocké.
 *
 * `unit` et `vatRate` sont facultatifs et prennent des valeurs par défaut
 * raisonnables : une prestation se compte au forfait, et la taxe est nulle
 * tant que l'émetteur n'a pas déclaré y être assujetti.
 */
export class QuoteLineDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  label!: string;

  @IsNumber()
  @Min(0)
  quantity!: number;

  /**
   * Unité de compte affichée en face de la quantité : « heure », « journée »,
   * « séance », « forfait ». Un devis qui annonce « 3 » sans dire trois quoi
   * n'engage personne — et c'est pourtant ce que l'établissement signe.
   */
  @IsOptional()
  @IsString()
  @MaxLength(30)
  unit?: string;

  /** Prix unitaire HORS TAXES. */
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice!: number;

  /**
   * Taux de TVA de la ligne, en pourcentage (0 ; 5,5 ; 10 ; 20). Par ligne et
   * non par devis : une même intervention peut mêler des taux différents, et
   * un total de taxe calculé sur un taux unique serait faux dès ce cas-là.
   */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  vatRate?: number;
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
