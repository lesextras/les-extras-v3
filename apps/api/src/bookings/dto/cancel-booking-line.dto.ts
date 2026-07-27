import { IsIn, IsString, MinLength } from "class-validator";
import { BookingLineType } from "../types/bookings.types";

export class CancelBookingLineDto {
  @IsIn(["MISSION", "SERVICE_BOOKING", "BOOKING"])
  lineType!: BookingLineType;

  @IsString()
  @MinLength(1)
  lineId!: string;
}
