import { IsEnum } from 'class-validator';
import { BookingStatus } from '@prisma/client';

/** Mise à jour du statut d'une réservation depuis le back-office. */
export class UpdateBookingStatusDto {
  @IsEnum(BookingStatus)
  status!: BookingStatus;
}
