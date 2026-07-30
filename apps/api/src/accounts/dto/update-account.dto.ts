import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateAccountDto } from './create-account.dto';

/** On ne permet PAS de changer le type d'un compte après création. */
export class UpdateAccountDto extends PartialType(
  OmitType(CreateAccountDto, ['type'] as const),
) {
  /**
   * Validation hiérarchique : si actif, une mission publiée par un MANAGER
   * attend l'approbation d'un OWNER/ADMIN avant diffusion.
   */
  @IsOptional()
  @IsBoolean()
  validationMissions?: boolean;
}
