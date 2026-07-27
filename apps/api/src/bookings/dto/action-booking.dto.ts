import { IsString, MinLength } from "class-validator";

export class ActionBookingDto {
    @IsString()
    @MinLength(1)
    bookingId!: string;
}
