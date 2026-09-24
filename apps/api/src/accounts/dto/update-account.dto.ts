import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateAccountDto } from './create-account.dto';

/** On ne permet PAS de changer le type d'un compte après création. */
export class UpdateAccountDto extends PartialType(
  OmitType(CreateAccountDto, ['type'] as const),
) {
  /**
   * ⚠ DÉPRÉCIÉ ET IGNORÉ (24/09/2026, « 1 compte = 1 personne ») : la
   * validation hiérarchique des missions n'existe plus. Accepté pour qu'un
   * ancien écran ne reçoive pas un 400 ; `AccountsService.update` ne l'écrit
   * pas.
   */
  @IsOptional()
  @IsBoolean()
  validationMissions?: boolean;
}
