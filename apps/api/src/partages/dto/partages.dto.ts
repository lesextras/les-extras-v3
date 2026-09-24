import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { NiveauPartage } from '@prisma/client';

export class InviterPartageDto {
  @IsEmail({}, { message: 'Cette adresse e-mail n’est pas valide.' })
  @MaxLength(200)
  email!: string;

  @IsEnum(NiveauPartage, { message: 'Choisissez un niveau de partage.' })
  niveau!: NiveauPartage;

  @IsOptional()
  @IsBoolean()
  inclutReservations?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}

export class DemanderPartageDto {
  @IsEmail({}, { message: 'Cette adresse e-mail n’est pas valide.' })
  @MaxLength(200)
  email!: string;

  @IsEnum(NiveauPartage, { message: 'Choisissez un niveau de partage.' })
  niveau!: NiveauPartage;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}

export class AccepterPartageDto {
  /** Pour une demande : la personne sollicitée peut accorder un autre niveau. */
  @IsOptional()
  @IsEnum(NiveauPartage)
  niveau?: NiveauPartage;

  @IsOptional()
  @IsBoolean()
  inclutReservations?: boolean;
}

export class ModifierPartageDto {
  @IsOptional()
  @IsEnum(NiveauPartage)
  niveau?: NiveauPartage;

  @IsOptional()
  @IsBoolean()
  inclutReservations?: boolean;
}

export class AffichagePartageDto {
  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'Couleur invalide.' })
  couleur?: string;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;
}
