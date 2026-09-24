import { IsEmail, IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { AccountRole } from '@prisma/client';

const ASSIGNABLE_ROLES = [
  AccountRole.ADMIN,
  AccountRole.MANAGER,
  AccountRole.MEMBER,
] as const;

/**
 * Invitation dans un espace Piloter (association, académie).
 *
 * Niveau, droits déclarés et services ont été retirés le 24/09/2026 (« 1 compte
 * = 1 personne » sur Les Extras) : l'écran « Droits d'accès » n'envoie que
 * l'adresse et le rôle.
 */
export class CreateInvitationDto {
  @IsEmail()
  email!: string;

  /** Rôle dans l'espace. MEMBER par défaut. */
  @IsOptional()
  @IsEnum(AccountRole)
  @IsIn(ASSIGNABLE_ROLES as unknown as AccountRole[], {
    message: 'Rôle invalide : autorisés = ADMIN, MANAGER, MEMBER.',
  })
  role?: AccountRole;

  /** Mot d'accompagnement, repris dans le courriel d'invitation. */
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;
}
