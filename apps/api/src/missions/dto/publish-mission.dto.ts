import { IsEnum, IsOptional } from 'class-validator';
import { MissionVisibility } from '@prisma/client';

/**
 * Palier de diffusion au moment de la publication.
 * RESERVED : les intervenants déjà venus ou retenus au vivier ; PUBLIC : toute
 * la marketplace (à réserver aux urgences).
 *
 * `SALARIES` reste accepté pour les anciens écrans (l'énumération n'a pas
 * bougé en base) mais est lu comme RESERVED : l'équipe interne n'existe plus
 * depuis le 24/09/2026 (« 1 compte = 1 personne »).
 */
export class PublishMissionDto {
  @IsOptional()
  @IsEnum(MissionVisibility)
  visibility?: MissionVisibility;
}
