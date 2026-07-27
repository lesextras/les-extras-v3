import { IsEnum, IsOptional } from 'class-validator';
import { MissionVisibility } from '@prisma/client';

/**
 * Palier de diffusion au moment de la publication.
 * SALARIES : l'équipe interne d'abord — RESERVED : les intervenants déjà
 * venus — PUBLIC : toute la marketplace (à réserver aux urgences).
 */
export class PublishMissionDto {
  @IsOptional()
  @IsEnum(MissionVisibility)
  visibility?: MissionVisibility;
}
