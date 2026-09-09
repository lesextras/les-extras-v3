import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CategorieRendezVous } from '@prisma/client';

export class CreerRendezVousDto {
  @IsString()
  @MinLength(2, { message: 'Donnez un titre à ce rendez-vous.' })
  @MaxLength(160)
  titre!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  lieu?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  lien?: string;

  @IsDateString({}, { message: 'La date de début n’est pas valide.' })
  debut!: string;

  @IsOptional()
  @IsDateString({}, { message: 'La date de fin n’est pas valide.' })
  fin?: string;

  @IsOptional()
  @IsBoolean()
  journeeEntiere?: boolean;

  @IsOptional()
  @IsEnum(CategorieRendezVous)
  categorie?: CategorieRendezVous;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participants?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20160)
  rappelMinutes?: number;
}

export class ModifierRendezVousDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  titre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  lieu?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  lien?: string;

  @IsOptional()
  @IsDateString()
  debut?: string;

  @IsOptional()
  @IsDateString()
  fin?: string | null;

  @IsOptional()
  @IsBoolean()
  journeeEntiere?: boolean;

  @IsOptional()
  @IsEnum(CategorieRendezVous)
  categorie?: CategorieRendezVous;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participants?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20160)
  rappelMinutes?: number;
}
