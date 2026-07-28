import { AssistantTrame } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Demande de génération : les notes brutes ne sont JAMAIS persistées. */
export class GenererDto {
  @IsEnum(AssistantTrame)
  trame!: AssistantTrame;

  @IsString()
  @MinLength(20, { message: 'Donnez un peu plus de matière : quelques phrases suffisent.' })
  @MaxLength(8000)
  notes!: string;
}

/** Enregistrement d'un document APRÈS relecture et validation par l'auteur. */
export class EnregistrerDocumentDto {
  @IsEnum(AssistantTrame)
  trame!: AssistantTrame;

  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @IsString()
  @MinLength(20)
  @MaxLength(20000)
  content!: string;
}

export class ModifierDocumentDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(20000)
  content?: string;
}

export class FeedbackDto {
  @IsEnum(AssistantTrame)
  trame!: AssistantTrame;

  @IsBoolean()
  utile!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}

/** Générateur d'activités éducatives & thérapeutiques. */
export class ActiviteDto {
  /** Public concerné (ex : « adolescents 12-16 ans en MECS »). */
  @IsString() @MinLength(3) @MaxLength(300)
  publicCible!: string;

  /** Besoins, symptômes ou troubles à travailler (texte libre du pro). */
  @IsString() @MinLength(10) @MaxLength(3000)
  besoins!: string;

  @IsOptional() @IsString() @MaxLength(300)
  objectifs?: string;

  @IsOptional() @IsString() @MaxLength(120)
  duree?: string;

  @IsOptional() @IsString() @MaxLength(60)
  effectif?: string;

  @IsOptional() @IsString() @MaxLength(500)
  contraintes?: string;
}

/** Bot conversationnel (site public et dashboard). */
export class ChatDto {
  @IsString() @MinLength(1) @MaxLength(2000)
  message!: string;

  @IsOptional()
  historique?: { role: 'user' | 'assistant'; content: string }[];

  /** Champ-piège anti-robot (public uniquement). */
  @IsOptional() @IsString()
  website?: string;
}

/** Aide au remplissage d'une fiche atelier/formation depuis un brief. */
export class FicheDto {
  @IsString() @MaxLength(20)
  type!: 'ATELIER' | 'FORMATION';

  @IsString() @MinLength(15) @MaxLength(3000)
  brief!: string;
}
