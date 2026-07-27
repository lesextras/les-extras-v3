import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

/**
 * Une fiche à importer depuis le catalogue historique (les-extras.fr).
 * `sourceId` sert de clé d'idempotence : réimporter met à jour, ne duplique pas.
 */
export class ImportListingDto {
  @IsString()
  sourceId!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsString()
  description!: string;

  /** Nom affiché de l'intervenant (le compte est créé s'il n'existe pas). */
  @IsOptional()
  @IsString()
  vendorName?: string;

  @IsOptional()
  @IsString()
  categoryTitle?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxParticipants?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  publicTargets?: string[];

  @IsOptional()
  @IsString()
  material?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsString()
  objectives?: string;

  @IsOptional()
  @IsString()
  methodology?: string;

  @IsOptional()
  @IsString()
  evaluation?: string;

  @IsOptional()
  @IsBoolean()
  publish?: boolean;
}

export class ImportCatalogDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportListingDto)
  listings!: ImportListingDto[];
}
