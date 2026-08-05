import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Demande d'un lien de réinitialisation. */
export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Adresse e-mail invalide.' })
  @MaxLength(180)
  email!: string;
}

/**
 * Choix du nouveau mot de passe.
 *
 * Les mêmes exigences qu'à l'inscription, mot pour mot : une lettre, un
 * chiffre, huit caractères. Une porte dérobée plus laxiste que la porte
 * d'entrée n'aurait aucun sens — c'est précisément par là qu'on passerait.
 */
export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Lien de réinitialisation manquant.' })
  token!: string;

  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' })
  @MaxLength(72, { message: 'Le mot de passe ne peut dépasser 72 caractères.' })
  @Matches(/[A-Za-z]/, { message: 'Le mot de passe doit contenir au moins une lettre.' })
  @Matches(/[0-9]/, { message: 'Le mot de passe doit contenir au moins un chiffre.' })
  password!: string;
}
