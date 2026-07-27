import { IsString, MinLength, MaxLength } from "class-validator";

export class RespondDeskRequestDto {
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  response!: string;
}
