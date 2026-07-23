import { IsString, MaxLength, MinLength } from 'class-validator';

/** Envoi d'un message dans une conversation. */
export class SendMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  body!: string;
}
