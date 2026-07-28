import { Type } from 'class-transformer';
import {
  IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength,
} from 'class-validator';

/** Métiers du secteur — liste fermée : c'est ce qui rend le filtre utile. */
export const METIERS = [
  'Éducateur spécialisé',
  'Moniteur-éducateur',
  'AES / AMP',
  'Éducateur de jeunes enfants',
  'Assistant de service social',
  'Psychologue',
  'Infirmier',
  'Aide-soignant',
  'Animateur',
  'Chef de service / Direction',
  'Art-thérapeute / Intervenant spécialisé',
  'Autre',
] as const;

/** Publics accompagnés — même logique de liste fermée. */
export const PUBLICS = [
  'Enfance et protection de l’enfance',
  'Adolescents',
  'Handicap mental et psychique',
  'Handicap moteur et polyhandicap',
  'Troubles du spectre autistique',
  'Adultes en insertion',
  'Grand âge et EHPAD',
  'Addictologie',
  'Public mixte',
] as const;

export class CreateQuestionDto {
  @IsString() @MinLength(10) @MaxLength(180)
  title!: string;

  @IsString() @MinLength(30) @MaxLength(4000)
  situation!: string;

  @IsOptional() @IsString() @MaxLength(2000)
  tente?: string;

  @IsIn(METIERS as unknown as string[])
  metier!: string;

  @IsIn(PUBLICS as unknown as string[])
  publicVise!: string;

  @IsOptional() @IsBoolean()
  anonyme?: boolean;

  /** Champ-piège anti-robot (doit rester vide). */
  @IsOptional() @IsString()
  website?: string;
}

export class CreateAnswerDto {
  @IsString() @MinLength(20) @MaxLength(4000)
  content!: string;

  @IsOptional() @IsBoolean()
  anonyme?: boolean;

  @IsOptional() @IsString()
  website?: string;
}

export class QueryQuestionsDto {
  @IsOptional() @IsString() @MaxLength(120) search?: string;
  @IsOptional() @IsString() @MaxLength(80) metier?: string;
  @IsOptional() @IsString() @MaxLength(80) publicVise?: string;
  @IsOptional() @IsIn(['recentes', 'sans-reponse', 'populaires']) tri?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(40) take?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) skip?: number;
}
