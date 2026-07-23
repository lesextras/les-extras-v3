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
}
