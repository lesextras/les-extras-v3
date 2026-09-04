import { IsBoolean, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

/**
 * Une page vue, sans identifiant de personne.
 *
 * ⚠ Ce DTO est volontairement pauvre : pas d'identifiant de visiteur, pas
 * d'agent utilisateur, pas de résolution d'écran. Tout champ ajouté ici doit
 * être relu à l'aune de l'exemption CNIL « mesure d'audience » — dès qu'on
 * peut suivre une personne d'une page à l'autre, l'exemption tombe.
 */
export class CreateVueDto {
  /** Chemin sans paramètres : « /formations/renforcer-ce-qui-va ». */
  @IsString()
  @MaxLength(200)
  @Matches(/^\/[A-Za-z0-9\-._~/%]*$/)
  chemin!: string;

  @IsOptional() @IsString() @MaxLength(60) source?: string;
  @IsOptional() @IsString() @MaxLength(60) medium?: string;
  @IsOptional() @IsString() @MaxLength(60) campagne?: string;

  /** Vrai sur la première page d'une session de navigation. */
  @IsOptional()
  @IsBoolean()
  visite?: boolean;
}
