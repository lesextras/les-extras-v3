import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Interet } from '@prisma/client';

/**
 * CE QU'UNE PERSONNE DÉCLARE : ce qu'elle veut faire, et si elle accepte
 * d'être vue par les établissements.
 *
 * ⚠ LES DEUX SONT SÉPARÉS, ET ILS DOIVENT LE RESTER. Cocher « je veux faire
 * des remplacements » dit une intention ; accepter de figurer dans une liste
 * consultée par des dizaines d'établissements est un CONSENTEMENT, et il se
 * donne à part. Quelqu'un qui cherche du travail ne doit pas découvrir qu'il
 * est listé parce qu'il a coché une case sur un autre sujet.
 */
export class DeclarerDisponibiliteDto {
  /**
   * Ce que la personne vient faire. Remplace la liste entière : l'écran
   * envoie toujours l'état complet des cases, y compris vide.
   */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsEnum(Interet, { each: true, message: 'Centre d’intérêt inconnu.' })
  interets?: Interet[];

  /** Le consentement à figurer dans le vivier ouvert. */
  @IsOptional()
  @IsBoolean()
  actif?: boolean;

  /**
   * Les montages acceptés. Sous-ensemble des intérêts, filtré par le service :
   * on ne se déclare disponible que pour ce qu'on a dit vouloir faire.
   */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @IsEnum(Interet, { each: true })
  montages?: Interet[];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  metier?: string;

  /**
   * ⚠ PAS DE `@IsIn` SUR LES CODES DE DÉPARTEMENT. Une liste de cent un codes
   * recopiée dans un DTO se désynchronise de `territoires.ts` au premier
   * ajout ; le service confronte au référentiel, qui fait foi.
   */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(101)
  @IsString({ each: true })
  departements?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(600)
  presentation?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Date de disponibilité invalide.' })
  aPartirDu?: string;
}

/** Les filtres de lecture du vivier, côté établissement. */
export class FiltresVivierDto {
  @IsOptional()
  @IsString()
  @MaxLength(3)
  departement?: string;

  @IsOptional()
  @IsEnum(Interet)
  montage?: Interet;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  metier?: string;
}
