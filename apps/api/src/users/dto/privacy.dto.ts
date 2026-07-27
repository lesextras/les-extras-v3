import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * Phrase de confirmation exigée pour déclencher l'anonymisation d'un compte.
 * Comparée après normalisation (trim + majuscules + espaces compactés) : on
 * tolère la casse et les espaces surnuméraires, jamais une phrase approchante.
 */
export const DELETION_CONFIRMATION_PHRASE = 'SUPPRIMER MON COMPTE';

/**
 * Demande de suppression (RGPD art. 17) — double confirmation.
 *
 * L'opération étant irréversible, deux preuves d'intention sont exigées :
 *  1. le mot de passe courant (preuve que c'est bien le titulaire du compte) ;
 *  2. la recopie manuelle d'une phrase (preuve que le geste est délibéré).
 *
 * Le ValidationPipe global est en `whitelist + forbidNonWhitelisted` : le
 * formulaire ne doit envoyer QUE ces deux champs.
 */
export class AccountDeletionRequestDto {
  /** Mot de passe actuel, vérifié avec bcrypt exactement comme à la connexion. */
  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe actuel est requis.' })
  @MaxLength(200)
  password!: string;

  /** Recopie de la phrase `DELETION_CONFIRMATION_PHRASE`. */
  @IsString()
  @IsNotEmpty({ message: 'La phrase de confirmation est requise.' })
  @MaxLength(120)
  confirmation!: string;
}
