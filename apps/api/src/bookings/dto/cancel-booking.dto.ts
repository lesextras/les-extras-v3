import { IsString, MaxLength, MinLength } from 'class-validator';

/** Annulation d'un booking avec motif obligatoire. */
export class CancelBookingDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}
