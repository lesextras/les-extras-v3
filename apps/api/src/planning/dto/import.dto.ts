import { ArrayMaxSize, IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * IMPORT D'UN PLANNING — EN DEUX TEMPS, JAMAIS EN UN SEUL.
 *
 * On lit d'abord, on écrit ensuite. Entre les deux, la personne relit ce qui
 * a été compris et corrige. Un planning mal lu qui entrerait tel quel dans
 * l'agenda, ce sont des heures supplémentaires fausses : on ne prend pas ce
 * risque pour économiser un clic.
 */
export class AnalyserPlanningDto {
  /** Pour l'afficher dans le récapitulatif, rien de plus. */
  @IsOptional() @IsString() @MaxLength(200)
  nomFichier?: string;

  /** Le contenu texte du fichier. Le navigateur lit, l'API comprend. */
  @IsString() @MinLength(1) @MaxLength(400000)
  contenu!: string;
}

/** Un créneau relu et confirmé, prêt à entrer au planning. */
export interface CreneauAImporter {
  titre: string;
  debut: string;
  fin: string;
  note?: string;
}

export class ImporterPlanningDto {
  @IsArray() @ArrayMaxSize(500)
  creneaux!: CreneauAImporter[];
}
