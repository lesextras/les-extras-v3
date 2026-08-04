import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AccountType } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  email!: string;

  /**
   * L'API acceptait « aaaaaaaa » : huit caractères, aucune autre exigence.
   * Le formulaire d'inscription, lui, réclame déjà une lettre ET un chiffre
   * (voir apps/web/src/lib/validation.ts). L'interface était donc plus
   * stricte que le serveur — un appel direct passait sous la règle affichée.
   * On aligne le serveur sur ce que le site promet déjà.
   */
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' })
  @MaxLength(72, { message: 'Le mot de passe ne peut dépasser 72 caractères.' })
  @Matches(/[A-Za-z]/, { message: 'Le mot de passe doit contenir au moins une lettre.' })
  @Matches(/[0-9]/, { message: 'Le mot de passe doit contenir au moins un chiffre.' })
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
