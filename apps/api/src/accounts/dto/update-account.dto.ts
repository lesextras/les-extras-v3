import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateAccountDto } from './create-account.dto';

/** On ne permet PAS de changer le type d'un compte après création. */
export class UpdateAccountDto extends PartialType(
  OmitType(CreateAccountDto, ['type'] as const),
) {}
