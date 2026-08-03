import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { BookingStatus } from '@prisma/client';

/** Filtres de la liste des bookings d'un compte. */
export class QueryBookingsDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  /** Nombre maximal de lignes rendues. Borné côté service à 200. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  take?: number;

  /**
   * Tolere et ignore : plusieurs ecrans envoient `scope=account` par symetrie
   * avec d'autres listes. Le refuser transformait ces ecrans en pages vides —
   * la validation stricte renvoyait 400, avale en silence par le front, et
   * l'intervenant ne voyait jamais les reservations de ses ateliers.
   */
  @IsOptional()
  @IsString()
  scope?: string;

  /** Restreindre aux renforts (mission) ou aux ateliers (service). */
  @IsOptional()
  @IsIn(['mission', 'service'])
  kind?: 'mission' | 'service';
}
