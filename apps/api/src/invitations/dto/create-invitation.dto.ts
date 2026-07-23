import { IsEmail, IsEnum, IsIn } from 'class-validator';
import { AccountRole } from '@prisma/client';

const ASSIGNABLE_ROLES = [
  AccountRole.ADMIN,
  AccountRole.MANAGER,
  AccountRole.MEMBER,
] as const;

export class CreateInvitationDto {
  @IsEmail()
  email!: string;

  /** On n'invite jamais quelqu'un directement comme OWNER. */
  @IsEnum(AccountRole)
  @IsIn(ASSIGNABLE_ROLES as unknown as AccountRole[], {
    message: 'Rôle invalide : autorisés = ADMIN, MANAGER, MEMBER.',
  })
  role!: AccountRole;
}
