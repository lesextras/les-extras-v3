import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

/** Création d'une session datée d'un programme. */
export class CreateSessionDto {
  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  /** Formateur : freelance (certifiant) ou salarié-membre (interne). */
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
}
