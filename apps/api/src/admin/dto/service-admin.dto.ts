import { IsArray, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ServiceCategory } from '@prisma/client';

/**
 * Correction éditoriale d'une fiche par l'administrateur.
 *
 * Volontairement limité aux champs de présentation : un administrateur corrige
 * une coquille, complète une ville manquante ou remplace une image, mais ne
 * touche ni au prix, ni au statut (qui passent par la modération).
 */
export class UpdateServiceAdminDto {
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(500) summary?: string;
  @IsOptional() @IsString() @MaxLength(20000) description?: string;
  @IsOptional() @IsString() @MaxLength(120) city?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) images?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) publicTargets?: string[];
  /**
   * RECLASSEMENT atelier ↔ formation. C'est la catégorie qui décide du
   * catalogue d'affichage : FORMATION sort la fiche de /ateliers et la range
   * avec les formations. Sans ce champ, des formations déposées comme
   * « atelier » restaient mélangées aux ateliers du réseau, sans aucun moyen
   * de les remettre au bon endroit autrement qu'en base.
   */
  @IsOptional() @IsEnum(ServiceCategory) category?: ServiceCategory;
}
