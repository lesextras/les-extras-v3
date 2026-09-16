import {
  IsArray,
  IsEmail,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  AccountRole,
  Capacite,
  NiveauResponsabilite,
  PorteeService,
} from '@prisma/client';

const ASSIGNABLE_ROLES = [
  AccountRole.ADMIN,
  AccountRole.MANAGER,
  AccountRole.MEMBER,
] as const;

export class InvitationServiceDto {
  @IsString()
  orgUnitId!: string;

  /**
   * RATTACHEMENT : la personne travaille dans ce service.
   * ENCADREMENT : la personne encadre ce service — c'est ce qui permet à un
   * chef de service d'inviter un coordinateur et de lui confier un AUTRE de
   * ses services.
   */
  @IsEnum(PorteeService)
  portee!: PorteeService;
}

export class CreateInvitationDto {
  @IsEmail()
  email!: string;

  /**
   * Rôle technique dans le compte. Facultatif depuis le 16/09/2026 : il se
   * déduit du niveau (Direction → ADMIN, Responsable → MANAGER, Salarié →
   * MEMBER). On ne le demande plus au formulaire, qui parle de responsabilité
   * et pas de rôle applicatif.
   */
  @IsOptional()
  @IsEnum(AccountRole)
  @IsIn(ASSIGNABLE_ROLES as unknown as AccountRole[], {
    message: 'Rôle invalide : autorisés = ADMIN, MANAGER, MEMBER.',
  })
  role?: AccountRole;

  /**
   * Niveau proposé à la personne invitée.
   *
   * ⚠ Il est RABATTU côté serveur à ce que l'invitant détient lui-même
   * (`niveauDelegable`) : on n'invite jamais plus haut que soi. Et une
   * DIRECTION invitée par quelqu'un qui n'est pas Direction validée arrive
   * déclarée mais NON VALIDÉE — elle ne voit donc rien de plus qu'un salarié
   * tant que Les Extras n'a pas tranché.
   */
  @IsOptional()
  @IsEnum(NiveauResponsabilite)
  niveau?: NiveauResponsabilite;

  /**
   * Droits accordés avec l'invitation. Rabattus eux aussi à ceux de
   * l'invitant : on ne délègue que ce que l'on détient.
   */
  @IsOptional()
  @IsArray()
  @IsEnum(Capacite, { each: true })
  capacites?: Capacite[];

  /**
   * Service auquel rattacher la personne dès son arrivée. Facultatif, mais
   * c'est ici qu'on le sait : celui qui invite connaît l'équipe qu'il renforce.
   * Sans lui, l'arrivant n'apparaît dans le planning d'aucun chef de service.
   */
  @IsOptional()
  @IsString()
  orgUnitId?: string;

  /** Rattachements et encadrements multiples. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvitationServiceDto)
  services?: InvitationServiceDto[];

  /** Mot d'accompagnement, repris dans le courriel d'invitation. */
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;
}
