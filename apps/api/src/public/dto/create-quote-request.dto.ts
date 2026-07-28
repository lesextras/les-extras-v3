import { HoneypotDto } from './honeypot';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Demande de devis déposée SANS COMPTE depuis une fiche publique.
 * Obliger la création d'un compte avant le premier contact fait perdre
 * l'essentiel des demandes : on récupère les coordonnées, on qualifie ensuite.
 */
export class CreateQuoteRequestDto extends HoneypotDto {
  /** Fiche concernée : atelier (id) ou formation (slug). */
  @IsOptional() @IsString() @MaxLength(60) serviceId?: string;
  @IsOptional() @IsString() @MaxLength(120) formationSlug?: string;

  @IsString() @MinLength(2) @MaxLength(120) name!: string;
  @IsEmail() email!: string;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsString() @MaxLength(160) organization?: string;
  @IsOptional() @IsString() @MaxLength(120) role?: string;
  @IsOptional() @IsString() @MaxLength(120) city?: string;
  /** Date ou période souhaitée, en texte libre. */
  @IsOptional() @IsString() @MaxLength(120) desiredDate?: string;
  @IsOptional() @IsString() @MaxLength(60) participants?: string;
  @IsString() @MinLength(10) @MaxLength(3000) message!: string;

  /** Origine (utm_source / référent) — renseignée par le formulaire. */
  @IsOptional() @IsString() @MaxLength(120) source?: string;
}
