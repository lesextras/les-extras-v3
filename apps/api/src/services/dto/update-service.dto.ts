import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { ServiceStatus } from '@prisma/client';
import { CreateServiceDto } from './create-service.dto';

/**
 * Mise à jour partielle : tous les champs de création deviennent facultatifs,
 * plus le statut (brouillon / publié / archivé).
 */
export class UpdateServiceDto extends PartialType(CreateServiceDto) {
  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;
}
