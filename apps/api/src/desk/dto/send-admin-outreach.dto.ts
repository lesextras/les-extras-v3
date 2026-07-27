import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class SendAdminOutreachDto {
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  message!: string;

  @IsOptional()
  @IsBoolean()
  notifyByEmail?: boolean;

  @IsOptional()
  @IsIn(["USER_PROFILE", "CONTACT_BYPASS", "MISSION_DETAIL"])
  origin?: "USER_PROFILE" | "CONTACT_BYPASS" | "MISSION_DETAIL";

  @IsOptional()
  @IsString()
  @MaxLength(120)
  contextId?: string;
}
