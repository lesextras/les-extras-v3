import { IsEmail, IsIn, IsOptional, IsString, MinLength } from "class-validator";

const FINANCE_TYPES = [
  "PAYMENT_ISSUE",
  "BOOKING_FAILURE",
  "PACK_PURCHASE_FAILURE",
  "MISSION_PUBLISH_FAILURE",
] as const;

const PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

export class CreateFinanceIncidentDto {
  @IsIn(FINANCE_TYPES)
  declare type: string;

  @IsOptional()
  @IsIn(PRIORITIES)
  declare priority?: string;

  @IsString()
  @MinLength(5)
  declare message: string;

  @IsEmail()
  declare requesterEmail: string;

  @IsOptional()
  @IsString()
  declare bookingId?: string;
}
