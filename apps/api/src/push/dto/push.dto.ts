import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class AbonnementPushDto {
  /** URL du service de push du navigateur (Google, Mozilla, Apple…). */
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(1000)
  endpoint!: string;

  /** Clé publique de l'appareil, pour chiffrer le message. */
  @IsString()
  @MaxLength(200)
  p256dh!: string;

  /** Sel d'authentification fourni par le navigateur. */
  @IsString()
  @MaxLength(100)
  auth!: string;

  /** Libellé lisible de l'appareil, choisi côté navigateur. */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  appareil?: string;
}

export class DesabonnementPushDto {
  @IsString()
  @MaxLength(1000)
  endpoint!: string;
}
