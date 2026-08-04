import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ServiceCategory } from '@prisma/client';

/** Filtres du catalogue public des ateliers. */
export class QueryServicesDto {
  @IsOptional()
  @IsEnum(ServiceCategory)
  category?: ServiceCategory;

  @IsOptional()
  @IsString()
  city?: string;

  /**
   * Recherche libre sur le titre et la description.
   *
   * Elle manquait : la barre de recherche du marché filtrait les missions et
   * laissait passer TOUS les ateliers, alors que l'écran annonce « Toutes les
   * missions de renfort et ateliers ». On tapait « médiation », la moitié de
   * la page ne bougeait pas.
   */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  skip?: number;
}
