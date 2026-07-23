import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/**
 * Avis post-booking. L'auteur est l'utilisateur courant ; la cible (targetId)
 * est l'autre partie du booking. Note de 1 à 5.
 */
export class CreateReviewDto {
  @IsString()
  bookingId!: string;

  @IsString()
  targetId!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
