import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Envoi d'un message dans une conversation. */
export class SendMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  body!: string;

  /**
   * Pièces jointes déjà déposées (famille MESSAGE).
   *
   * ⚠ Ces fichiers ne sont JAMAIS publics : un fil du médico-social peut porter
   * un compte rendu ou un planning nominatif. L'accès se vérifie fil par fil.
   */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  pieceIds?: string[];
}
