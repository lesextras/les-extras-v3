import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
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

  /** Galerie : URLs de fichiers déposés ou d'images externes. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

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
