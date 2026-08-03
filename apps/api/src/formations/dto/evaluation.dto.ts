import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/**
 * LES DEUX ÉVALUATIONS.
 *
 * Le référentiel national qualité ne se contente pas d'une note en sortie de
 * salle. Il demande d'apprécier l'atteinte des objectifs (indicateur 11) et de
 * recueillir l'appréciation des bénéficiaires et des financeurs (indicateur
 * 30) — puis d'en tirer des améliorations (indicateur 32).
 *
 * D'où la séparation en deux temps :
 *   • à chaud — en fin de session, ce que la personne a ressenti et retenu ;
 *   • à froid — quelques mois plus tard, ce qu'elle en fait réellement.
 *
 * La seconde est celle qui compte en audit, et c'est celle qui manquait
 * entièrement : la base n'avait même pas de colonne pour l'accueillir.
 */

/** Mise en œuvre des acquis, telle que l'apprenant la déclare. */
export enum MiseEnOeuvre {
  OUI = 'OUI',
  PARTIELLEMENT = 'PARTIELLEMENT',
  NON = 'NON',
}

/** Évaluation à chaud : fin de session. */
export class EvaluationChaudDto {
  /** Satisfaction générale, de 1 (très insuffisant) à 5 (très satisfait). */
  @IsInt()
  @Min(1)
  @Max(5)
  satisfaction!: number;

  /** Ce que l'apprenant retient, ce qui lui a manqué. */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  commentaire?: string;

  /**
   * Atteinte des objectifs pédagogiques, appréciée par le formateur.
   * Champ court et libre : les modalités d'évaluation varient d'un programme
   * à l'autre, et imposer une échelle unique produirait des données fausses.
   */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  resultat?: string;
}

/** Évaluation à froid : quelques mois après, sur le poste de travail. */
export class EvaluationFroidDto {
  /** Utilité perçue avec le recul, de 1 à 5. */
  @IsInt()
  @Min(1)
  @Max(5)
  note!: number;

  /** Les acquis ont-ils été mis en œuvre ? */
  @IsEnum(MiseEnOeuvre)
  miseEnOeuvre!: MiseEnOeuvre;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  commentaire?: string;
}
