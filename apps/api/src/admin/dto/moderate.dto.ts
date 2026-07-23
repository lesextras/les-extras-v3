import { IsEnum } from 'class-validator';
import { MissionStatus, ServiceStatus } from '@prisma/client';

/** Modération d'une mission : forcer un statut (ex: CLOSED, CANCELLED). */
export class ModerateMissionDto {
  @IsEnum(MissionStatus)
  status!: MissionStatus;
}

/** Modération d'un service : forcer un statut (ex: ARCHIVED). */
export class ModerateServiceDto {
  @IsEnum(ServiceStatus)
  status!: ServiceStatus;
}
