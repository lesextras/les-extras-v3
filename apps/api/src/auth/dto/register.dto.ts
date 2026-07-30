import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AccountType } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' })
  @MaxLength(72, { message: 'Le mot de passe ne peut dépasser 72 caractères.' })
  password!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  lastName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  /**
   * Type de compte créé à l'inscription :
   *  - FREELANCE : compte personnel du praticien.
   *  - ESTABLISHMENT : organisation (MECS, IME...), nécessite un nom de structure.
   */
  @IsEnum(AccountType)
  accountType!: AccountType;

  /** Nom de la structure — requis pour un compte ESTABLISHMENT. */
  @IsOptional()
  @IsString()
  @MaxLength(160)
  organizationName?: string;

  // --- Attribution ---------------------------------------------------------
  // Envoyés par le navigateur, donc non fiables par nature : on les borne en
  // longueur et on ne s'en sert que pour des statistiques, jamais pour une
  // décision d'accès.
  @IsOptional() @IsString() @MaxLength(60) source?: string;
  @IsOptional() @IsString() @MaxLength(60) sourceMedium?: string;
  @IsOptional() @IsString() @MaxLength(60) sourceCampaign?: string;
  @IsOptional() @IsString() @MaxLength(120) sourceLanding?: string;
  /** Compte intervenant parrain (lien de parrainage). */
  @IsOptional() @IsString() @MaxLength(60) parrain?: string;
}
