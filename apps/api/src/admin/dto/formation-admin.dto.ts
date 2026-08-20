import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { FormationStatus, FormationType, SessionStatus } from '@prisma/client';

/**
 * Création d'un programme de formation depuis le back-office ADMIN.
 * Par défaut CERTIFIANTE (catalogue OF ADéPA — Qualiopi). Si INTERNE,
 * `cpfEligible` et `certifying` sont forcés à false côté service.
 */
export class CreateFormationAdminDto {
  @IsString() title!: string;
  @IsOptional() @IsEnum(FormationType) type?: FormationType;
  @IsOptional() @IsString() summary?: string;
  @IsOptional() @IsString() objectives?: string;
  @IsOptional() @IsString() prerequisites?: string;
  @IsOptional() @IsString() program?: string;
  @IsOptional() @IsString() targetAudience?: string;
  @IsOptional() @IsInt() @Min(1) durationHours?: number;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsBoolean() cpfEligible?: boolean;
  @IsOptional() @IsBoolean() certifying?: boolean;
  @IsOptional() @IsString() certificationName?: string;
  @IsOptional() @IsString() edofRef?: string;
  @IsOptional() @IsEnum(FormationStatus) status?: FormationStatus;
  /** Compte OF propriétaire (fallback si l'admin ne dispose d'aucun compte). */
  @IsOptional() @IsString() ownerAccountId?: string;
}

/** Mise à jour d'un programme (contenu + changement de statut). */
export class UpdateFormationAdminDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsEnum(FormationType) type?: FormationType;
  @IsOptional() @IsString() summary?: string;
  @IsOptional() @IsString() objectives?: string;
  @IsOptional() @IsString() prerequisites?: string;
  @IsOptional() @IsString() program?: string;
  @IsOptional() @IsString() targetAudience?: string;
  @IsOptional() @IsInt() @Min(1) durationHours?: number;
  @IsOptional() @IsString() categoryId?: string | null;
  @IsOptional() @IsBoolean() cpfEligible?: boolean;
  @IsOptional() @IsBoolean() certifying?: boolean;
  @IsOptional() @IsString() certificationName?: string;
  @IsOptional() @IsString() edofRef?: string;
  @IsOptional() @IsEnum(FormationStatus) status?: FormationStatus;
}

/** Planification d'une session datée pour un programme. */
export class CreateSessionAdminDto {
  @IsOptional() @IsString() title?: string;
  @IsDateString() startDate!: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsInt() @Min(1) maxSeats?: number;
  @IsOptional() @IsNumber() priceHt?: number;
  /** Remuneration du formateur, hors taxes — distincte du prix de vente. */
  @IsOptional() @IsNumber() trainerFeeHt?: number;
  @IsOptional() @IsString() trainerId?: string;
  @IsOptional() @IsEnum(SessionStatus) status?: SessionStatus;
}

/**
 * Correction d'une session existante par l'administration plateforme.
 * L'admin pouvait créer une session mais jamais la corriger ensuite : une
 * erreur de prix ou de date publiée restait figée, sauf à être membre du
 * compte organisme propriétaire — ce que l'administration n'est pas.
 */
export class UpdateSessionAdminDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsInt() @Min(1) maxSeats?: number;
  @IsOptional() @IsNumber() priceHt?: number;
  /** Remuneration du formateur, hors taxes — distincte du prix de vente. */
  @IsOptional() @IsNumber() trainerFeeHt?: number;
  @IsOptional() @IsString() trainerId?: string;
  @IsOptional() @IsEnum(SessionStatus) status?: SessionStatus;
}
