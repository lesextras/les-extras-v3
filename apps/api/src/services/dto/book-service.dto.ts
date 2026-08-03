import { IsInt, IsISO8601, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/**
 * Réservation d'un atelier : crée un Booking REQUESTED.
 *
 * Le formulaire demandait depuis toujours le nombre de participants et des
 * précisions ; le DTO ne les acceptait pas, et `forbidNonWhitelisted` faisait
 * échouer la requête en 400 dès que l'établissement remplissait l'un des deux.
 * Autrement dit : le bouton « Réserver cet atelier » ne marchait que si on
 * laissait le formulaire à moitié vide.
 */
export class BookServiceDto {
  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;

  /**
   * Ce que l'intervenant a besoin de savoir avant de dire oui : un atelier
   * conçu pour huit personnes ne se tient pas à vingt.
   */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  participants?: number;

  /** Public accueilli, objectifs, contraintes de lieu. */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;
}
