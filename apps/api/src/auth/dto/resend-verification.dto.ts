import { IsEmail, MaxLength } from 'class-validator';

/** Renvoi du lien de confirmation d'adresse. */
export class ResendVerificationDto {
  @IsEmail({}, { message: 'Adresse e-mail invalide.' })
  @MaxLength(180)
  email!: string;
}
