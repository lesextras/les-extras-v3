import { IsString, MaxLength, MinLength } from "class-validator";

export class RequestMissionInfoDto {
  @IsString()
  @MinLength(10, { message: "Votre demande doit faire au moins 10 caractères." })
  @MaxLength(1000, { message: "Maximum 1000 caractères." })
  message!: string;
}
