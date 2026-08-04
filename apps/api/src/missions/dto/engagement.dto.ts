import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

/** « Je prends la mission » — l'intervenant peut joindre un mot. */
export class SengagerDto {
  /**
   * Court message à l'établissement. Facultatif, mais c'est souvent lui qui
   * emporte la décision : « je connais déjà le groupe des grands » vaut mieux
   * qu'un CV.
   */
  @IsOptional()
  @IsString()
  @MaxLength(600)
  message?: string;
}

/** Décision de l'établissement sur le profil qui lui est présenté. */
export class DeciderEngagementDto {
  @IsIn(['ACCEPTE', 'REFUSE'])
  decision!: 'ACCEPTE' | 'REFUSE';

  /**
   * Motif du refus, transmis tel quel à l'intervenant. On le demande : un
   * refus sans raison démobilise plus sûrement qu'une mission perdue.
   */
  @IsOptional()
  @IsString()
  @MaxLength(400)
  motif?: string;
}
