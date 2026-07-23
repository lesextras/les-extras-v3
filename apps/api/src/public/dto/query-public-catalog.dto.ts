import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

/** Filtres du catalogue PUBLIC (ateliers & formations publiés). */
export class QueryPublicCatalogDto {
  /** all = tout | atelier = catégories hors FORMATION | formation = catégorie FORMATION. */
  @IsOptional()
  @IsIn(['all', 'atelier', 'formation'])
  type?: 'all' | 'atelier' | 'formation';

  /** Filtre sur la catégorie éditable (categoryRef.title). */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string;

  /** Recherche plein texte simple (titre + description). */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

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
