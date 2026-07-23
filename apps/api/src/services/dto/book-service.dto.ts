import { IsISO8601, IsOptional } from 'class-validator';

/** Réservation d'un atelier : crée un Booking REQUESTED. */
export class BookServiceDto {
  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;
}
