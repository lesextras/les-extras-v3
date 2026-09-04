import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/** Une question fréquente affichée sur la fiche. */
export class FaqItemDto {
  @IsString()
  @MaxLength(300)
  question!: string;

  @IsString()
  @MaxLength(2000)
  answer!: string;
}

/** Option facturable en supplément (déplacement, matériel, séance sup.). */
export class PriceExtraDto {
  @IsString()
  @MaxLength(160)
  label!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;
}
import { ServiceCategory } from '@prisma/client';

/** Création d'un atelier / Éducat'heures par un FREELANCE (statut DRAFT). */
export class CreateServiceDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @IsString()
  @MinLength(10)
  description!: string;

  @IsOptional()
  @IsEnum(ServiceCategory)
  category?: ServiceCategory;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxParticipants?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  publicTarget?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  city?: string;

  /**
   * LES DÉPARTEMENTS RÉELLEMENT COUVERTS, en codes INSEE.
   *
   * ⚠ C'est ce qui remplace `city` au filtrage du catalogue. Le champ « ville »
   * en texte libre produisait des lieux incomparables — « Île-de-France » et
   * « Ile de France » vivaient côte à côte, et « Créteil » ne rendait aucune
   * fiche alors que treize annonçaient couvrir toute la région. Voir
   * `common/territoires.ts`.
   *
   * Une fiche sans département reste publiable : elle n'apparaît simplement pas
   * quand on filtre par territoire. Rendre le champ obligatoire aurait bloqué la
   * republication des fiches existantes, ce qui coûte plus cher que le manque.
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  departements?: string[];
  /** Durée en minutes (480 = 8 h) : sert au tri et aux filtres. */
  @IsOptional()
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  /** Publics visés : Adolescent, Enfant, Handicap, Sénior… */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  publicTargets?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  material?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  prerequisites?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  objectives?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  methodology?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  evaluation?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FaqItemDto)
  faq?: FaqItemDto[];

  /**
   * Galerie : URLs de fichiers déposés ou d'images externes.
   *
   * ⚠ AU MOINS UNE IMAGE EST OBLIGATOIRE À LA CRÉATION — décision de Siham,
   * 3 septembre 2026, et c'est une règle de catalogue, pas une préférence.
   * Une carte sans photo se fait ouvrir nettement moins que ses voisines : sur
   * une grille, elle a l'air en panne. Le catalogue affichait jusqu'ici un
   * dégradé de remplacement à sa place — une rustine honnête, mais qui laissait
   * partir des fiches muettes.
   *
   * ⚠ L'OBLIGATION NE VAUT QU'À LA CRÉATION. `UpdateServiceDto` la laisse
   * facultative, à dessein : trois fiches déjà publiées n'ont pas d'image, et
   * rendre le champ obligatoire à la modification empêcherait leurs auteurs de
   * corriger quoi que ce soit d'autre tant qu'ils n'ont pas de photo sous la
   * main. On ferme la porte d'entrée, on ne mure pas ceux qui sont dedans.
   */
  @IsArray()
  @ArrayNotEmpty({ message: 'Ajoutez au moins une photo à votre fiche.' })
  @IsString({ each: true })
  images!: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceExtraDto)
  priceExtras?: PriceExtraDto[];
  /** Créneaux proposés à la réservation : ["9h-12h", "14h-17h"]. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  timeSlots?: string[];

  /** Formation couverte par la certification Qualiopi d'ADéPA. */
  @IsOptional()
  @IsBoolean()
  qualiopi?: boolean;
}
