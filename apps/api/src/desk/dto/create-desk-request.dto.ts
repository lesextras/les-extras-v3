import { IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export const USER_DESK_REQUEST_TYPES = [
  "MISSION_INFO_REQUEST",
  "MISSION_PUBLISH_FAILURE",
  "BOOKING_FAILURE",
  "PACK_PURCHASE_FAILURE",
  "TECHNICAL_ISSUE",
  "USER_REPORT",
  "LITIGE",
] as const;

export class CreateDeskRequestDto {
  @IsIn(USER_DESK_REQUEST_TYPES)
  declare type: string;

  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  declare message: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  declare bookingId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  declare missionId?: string;
}
