import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Champ-piège commun aux formulaires publics.
 *
 * Il est rendu invisible côté web (hors flux, `aria-hidden`, `tabindex=-1`) :
 * un humain ne le remplit jamais, un robot le remplit presque toujours.
 * On répond alors 201 sans rien créer — silence volontaire, pour ne pas
 * apprendre au robot à contourner le piège.
 */
export class HoneypotDto {
  @IsOptional() @IsString() @MaxLength(200) website?: string;
}
