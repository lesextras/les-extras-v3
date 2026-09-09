import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { SupportCategorie, SupportStatut } from '@prisma/client';

export class OuvrirTicketDto {
  @IsString()
  @MinLength(3, { message: 'Donnez un objet à votre message (3 caractères minimum).' })
  @MaxLength(140)
  sujet!: string;

  @IsString()
  @MinLength(10, { message: 'Décrivez votre demande en quelques mots (10 caractères minimum).' })
  @MaxLength(5000)
  message!: string;

  @IsOptional()
  @IsEnum(SupportCategorie)
  categorie?: SupportCategorie;
}

export class RepondreTicketDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  message!: string;
}

export class SuivreTicketDto {
  @IsOptional()
  @IsEnum(SupportStatut)
  statut?: SupportStatut;
}
