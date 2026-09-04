import { HoneypotDto } from './honeypot';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

/**
 * Demande de fiche récap depuis la fiche publique d'un parcours gratuit.
 *
 * Les champs `source*` viennent de `lib/source.ts` côté web : même vocabulaire
 * que sur l'inscription, pour que captures et comptes se comparent canal par
 * canal dans l'administration.
 */
export class CreateCaptureDto extends HoneypotDto {
  @IsEmail()
  email!: string;

  /** Slug de la formation : lettres, chiffres et tirets, rien d'autre. */
  @IsString()
  @MaxLength(120)
  @Matches(/^[a-z0-9-]+$/)
  slug!: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  prenom?: string;

  /** Opt-in EXPLICITE pour la séquence d'accueil. Absent = non. */
  @IsOptional()
  @IsBoolean()
  consentTunnel?: boolean;

  @IsOptional() @IsString() @MaxLength(60) source?: string;
  @IsOptional() @IsString() @MaxLength(60) sourceMedium?: string;
  @IsOptional() @IsString() @MaxLength(60) sourceCampaign?: string;
  @IsOptional() @IsString() @MaxLength(120) sourceLanding?: string;
}

/** Désabonnement par jeton : la personne n'a pas de compte. */
export class DesabonnementCaptureDto {
  @IsString()
  @MaxLength(80)
  @Matches(/^[a-z0-9]+$/)
  jeton!: string;
}
