import { IsBooleanString, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

/** Filtres du catalogue PUBLIC des formations publiées. */
export class QueryPublicFormationsDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  /** Ville de la session ou du site de formation. */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  /** Filtres de financement : passés en chaîne depuis le formulaire GET. */
  @IsOptional()
  @IsBooleanString()
  cpf?: string;

  @IsOptional()
  @IsBooleanString()
  certifying?: string;

  /** Budget maximum, appliqué au prix d'appel de la prochaine session. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceMax?: number;

  @IsOptional()
  @IsIn(['recent', 'price-asc', 'price-desc', 'duration-asc', 'soonest'])
  sort?: 'recent' | 'price-asc' | 'price-desc' | 'duration-asc' | 'soonest';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  take?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;
}
