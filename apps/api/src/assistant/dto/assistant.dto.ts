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
