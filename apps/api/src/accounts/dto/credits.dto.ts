import { IsInt } from 'class-validator';

export class AdjustCreditsDto {
  /** Variation de crédits : positif = ajout, négatif = consommation. */
  @IsInt()
  delta!: number;
}
