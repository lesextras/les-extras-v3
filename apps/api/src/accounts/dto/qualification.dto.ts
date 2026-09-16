import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { AccountType } from '@prisma/client';

/**
 * QUALIFIER UN COMPTE TOUT JUSTE CRÉÉ.
 *
 * Le parcours d'inscription crée le compte à la PREMIÈRE étape — « vos
 * identifiants » — pour que la personne soit entrée avant d'avoir à se
 * décrire. À ce moment-là on ne sait encore ni ce qu'elle est, ni où elle
 * travaille : ces deux réponses arrivent aux étapes suivantes, et c'est cette
 * route qui les enregistre.
 */
export class QualificationDto {
  @IsEnum(AccountType)
  type!: AccountType;

  /** Nom de l'établissement — pour un compte ESTABLISHMENT. */
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  organizationName?: string;
}
