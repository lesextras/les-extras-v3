import { IsBoolean, IsISO8601, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateShiftDto {
  @IsString() @MinLength(2) @MaxLength(160)
  title!: string;

  @IsISO8601()
  startAt!: string;

  @IsISO8601()
  endAt!: string;

  @IsOptional() @IsString()
  freelanceId?: string;

  @IsOptional() @IsString()
  missionId?: string;

  @IsOptional() @IsString()
  bookingId?: string;

  @IsOptional() @IsString() @MaxLength(2000)
  notes?: string;

  @IsOptional() @IsString()
  recurrenceRule?: string;

  /** Forcer la création malgré un conflit détecté. */
  @IsOptional() @IsBoolean()
  force?: boolean;

  /**
   * Motif de dérogation. Obligatoire pour passer outre un plafond de durée du
   * travail : il est enregistré avec la date, et consultable en cas de contrôle.
   */
  @IsOptional() @IsString() @MinLength(5) @MaxLength(500)
  derogationMotif?: string;
}

export class UpdateShiftDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(160) title?: string;
  @IsOptional() @IsISO8601() startAt?: string;
  @IsOptional() @IsISO8601() endAt?: string;
  @IsOptional() @IsString() freelanceId?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
  @IsOptional() @IsBoolean() force?: boolean;
  @IsOptional() @IsString() @MinLength(5) @MaxLength(500) derogationMotif?: string;
}

export class SetStatusDto {
  @IsString()
  status!: 'PLANNED' | 'CONFIRMED' | 'DONE' | 'CANCELLED';
}

export class AvailabilityDto {
  @IsOptional() startTime?: string;
  @IsOptional() endTime?: string;
  @IsOptional() weekday?: number;
  @IsOptional() @IsISO8601() date?: string;
  @IsOptional() @IsString() type?: 'AVAILABLE' | 'UNAVAILABLE';
}
