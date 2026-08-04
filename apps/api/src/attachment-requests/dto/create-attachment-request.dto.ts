import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAttachmentRequestDto {
  /**
   * Compte ÉTABLISSEMENT auquel ce compte « salarié » (freelance en attendant)
   * demande à être rattaché. Choisi via la recherche d'établissement côté front.
   */
  @IsString()
  @MinLength(1, { message: "Sélectionnez un établissement." })
  establishmentAccountId!: string;

  /** Petit mot facultatif à l'attention de l'établissement (poste, contexte…). */
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '500 caractères maximum.' })
  message?: string;
}
