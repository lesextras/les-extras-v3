import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Ouvre une conversation, éventuellement rattachée à une mission,
 *  avec un premier message. */
export class CreateConversationDto {
  @IsOptional()
  @IsString()
  missionId?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  body!: string;
}
