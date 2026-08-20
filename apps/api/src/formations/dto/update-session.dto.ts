import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { SessionStatus } from '@prisma/client';

/** Mise à jour partielle d'une session. */
export class UpdateSessionDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  trainerId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxSeats?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  priceHt?: number;

  /**
   * Rémunération du formateur, hors taxes.
   *
   * Champ RÉSERVÉ à l'organisme et à l'établissement hôte : le service ignore
   * ce champ quand la requête vient du formateur lui-même (cf.
   * `updateSession`). Il n'appartient pas au prestataire de fixer, depuis le
   * compte de son client, ce que ce client lui devra.
   */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  trainerFeeHt?: number;

  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;
}
