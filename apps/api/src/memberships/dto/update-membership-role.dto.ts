import { IsEnum } from 'class-validator';
import { AccountRole } from '@prisma/client';

export class UpdateMembershipRoleDto {
  @IsEnum(AccountRole)
  role!: AccountRole;
}
