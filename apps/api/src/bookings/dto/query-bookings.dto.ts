import { IsEnum, IsOptional } from 'class-validator';
import { BookingStatus } from '@prisma/client';

/** Filtres de la liste des bookings d'un compte. */
export class QueryBookingsDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
}
