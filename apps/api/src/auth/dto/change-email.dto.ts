import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

/** Changement de l’adresse du compte : la nouvelle adresse + le mot de passe. */
export class ChangeEmailDto {
  @IsEmail({}, { message: 'Cette adresse e-mail n’est pas valide.' })
  @MaxLength(180)
  email!: string;

  @IsString()
  @MinLength(1, { message: 'Votre mot de passe est demandé pour cette opération.' })
  @MaxLength(200)
  password!: string;
}
