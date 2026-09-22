import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TypeConversation } from '@prisma/client';

export class OuvrirFilDto {
  @IsEnum(TypeConversation)
  type!: TypeConversation;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  sujet?: string;

  /** Fil d'équipe : les personnes à qui l'on écrit. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  participantIds?: string[];

  /** Fil de service : tout le service est destinataire. */
  @IsOptional()
  @IsString()
  orgUnitId?: string;

  /**
   * Fil avec un intervenant : l'une des deux est OBLIGATOIRE.
   * Sans demande, il n'y a pas de fil — voir `conversations.service.ts`.
   */
  @IsOptional()
  @IsString()
  quoteId?: string;

  @IsOptional()
  @IsString()
  bookingId?: string;

  /**
   * Fil ouvert depuis une fiche du catalogue : la question avant le devis.
   *
   * Il n’y a pas de demande derrière, et c’est voulu : on demande si l’atelier
   * convient à des 6-8 ans avant de demander un prix. Le masquage des
   * coordonnées s’applique à ce fil comme aux autres — c’est lui qui protège
   * le modèle, pas l’absence de messagerie.
   */
  @IsOptional()
  @IsString()
  serviceId?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  body!: string;
}

export class ModifierMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  body!: string;
}

export class SignalerMessageDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  motif?: string;
}

export class AjouterParticipantsDto {
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  userIds!: string[];
}

export class FermerFilDto {
  @IsBoolean()
  fermee!: boolean;
}

export class NotificationsFilDto {
  @IsBoolean()
  actif!: boolean;
}
