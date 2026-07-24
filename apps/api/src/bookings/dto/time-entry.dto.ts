import { IsIn, IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

/** Déclaration d'un créneau travaillé par le freelance (pointage). */
export class CreateTimeEntryDto {
  @IsISO8601()
  startedAt!: string;

  @IsOptional()
  @IsISO8601()
  endedAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

/** Validation / refus d'un créneau par l'établissement. */
export class ReviewTimeEntryDto {
  @IsIn(['VALIDATED', 'REJECTED'])
  status!: 'VALIDATED' | 'REJECTED';
}
