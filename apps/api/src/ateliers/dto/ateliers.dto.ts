import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { StatutReservationAtelier } from '@prisma/client';

/** Ce que l'intervenant règle sur SA fiche pour encaisser en ligne. */
export class ReglagePaiementDto {
  @IsOptional() @IsBoolean() paiementEnLigne?: boolean;
  @IsOptional() @IsString() @MaxLength(4000) annulationTexte?: string;
}

/** Ce qu'une personne remplit avant de payer un atelier. */
export class PayerAtelierDto {
  @IsEmail({}, { message: "Cette adresse e-mail n'est pas valide." }) email!: string;
  @IsOptional() @IsString() @MaxLength(120) nom?: string;
  @IsOptional() @IsString() @MaxLength(40) telephone?: string;
  @IsOptional() @IsString() @MaxLength(160) organisation?: string;
  @IsOptional() @IsString() @MaxLength(2000) message?: string;
  @IsOptional() @IsISO8601() dateSouhaitee?: string;
  @IsOptional() @IsString() @MaxLength(80) creneau?: string;
  @IsOptional() @IsInt() @Min(1) @Max(500) participants?: number;
  /**
   * D'OU PART L'ACHETEUR, pour savoir ou le ramener apres le paiement.
   *
   * Deux valeurs fermees, jamais une adresse. Accepter une URL de retour
   * envoyee par le navigateur reviendrait a laisser n'importe qui expedier un
   * acheteur ou il veut, une fois sa carte debitee.
   */
  @IsOptional() @IsIn(['fiche', 'espace']) depuis?: 'fiche' | 'espace';
}

/** Ce que l'intervenant change sur une réservation déjà payée. */
export class SuiviReservationDto {
  @IsOptional() @IsEnum(StatutReservationAtelier) statut?: StatutReservationAtelier;
  @IsOptional() @IsString() @MaxLength(2000) noteInterne?: string;
}

/** Un remboursement, total par défaut. */
export class RemboursementDto {
  /** En centimes. Absent = tout ce qui a été payé. */
  @IsOptional() @IsInt() @Min(1) montantCents?: number;
}
