import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Ouvre une conversation rattachée à une mission, avec un premier message.
 *
 * `missionId` était facultatif : une requête sans lui créait un fil sans
 * destinataire possible — on écrivait à personne, sans le moindre retour, et
 * le message restait dans une conversation orpheline. La mission est le seul
 * rattachement que la messagerie sait résoudre : elle est donc requise.
 */
export class CreateConversationDto {
  @IsString()
  @IsNotEmpty({ message: 'Indiquez la mission concernée par ce message.' })
  missionId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  body!: string;
}
