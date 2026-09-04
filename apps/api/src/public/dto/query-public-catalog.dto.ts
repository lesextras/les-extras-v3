import { IsIn, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
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

  /** Public visé : Adolescent, Enfant, Handicap, Sénior… */
  @IsOptional()
  @IsString()
  @MaxLength(60)
  public?: string;

  /**
   * Département couvert : code INSEE ou adresse lisible (« 77 »,
   * « seine-et-marne »). C'est le filtre de lieu du catalogue.
   */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  departement?: string;

  /**
   * Ancien filtre de lieu, en texte libre. ⚠ Conservé UNIQUEMENT pour ne pas
   * casser un lien déjà partagé ou indexé : il comparait `city` avec un
   * `contains` qui ignorait les accents, si bien que « Ile de France » et
   * « Île-de-France » ne rendaient pas les mêmes fiches. Plus rien ne le
   * propose dans l'interface. Voir `common/territoires.ts`.
   */
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  /** Budget maximum, en euros. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMax?: number;

  /** Ordre d'affichage. */
  @IsOptional()
  @IsIn(['recent', 'rating', 'price-asc', 'price-desc'])
  sort?: 'recent' | 'rating' | 'price-asc' | 'price-desc';

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
