import { IsEmail, IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
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

  /**
   * Service auquel rattacher la personne dès son arrivée. Facultatif, mais
   * c'est ici qu'on le sait : celui qui invite connaît l'équipe qu'il renforce.
   * Sans lui, l'arrivant n'apparaît dans le planning d'aucun chef de service.
   */
  @IsOptional()
  @IsString()
  orgUnitId?: string;
}
