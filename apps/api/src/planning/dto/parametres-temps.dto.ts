import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Les bornes posées ici ne sont pas décoratives : ce sont celles de l'ordre
 * public. Le seuil annuel est plafonné à mille six cent sept heures, les
 * majorations d'heures supplémentaires au plancher de dix pour cent, la plage
 * de nuit à l'amplitude 21 h – 7 h. Le service les revérifie, et la base les
 * redouble par une contrainte : trois barrières valent mieux qu'une pour une
 * règle dont la violation se paie devant un conseil de prud'hommes.
 */
export class MajParametresTempsDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  convention?: string;

  @IsOptional()
  @IsBoolean()
  accordEntreprise?: boolean;

  // --- Nuit -----------------------------------------------------------------

  /** L'article L. 3122-2 impose de commencer au plus tôt à 21 h. */
  @IsOptional()
  @IsInt()
  @Min(21)
  @Max(23)
  nuitDebutHeure?: number;

  /** Et de s'achever au plus tard à 7 h, en couvrant minuit – 5 h. */
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(7)
  nuitFinHeure?: number;

  /**
   * Majoration de nuit. Aucune valeur suggérée : la loi n'en impose pas
   * (article L. 3122-8), elle relève de la convention.
   */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(200)
  nuitPct?: number;

  // --- Dimanche et fériés ---------------------------------------------------

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(200)
  dimanchePct?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(200)
  feriePct?: number;

  @IsOptional()
  @IsBoolean()
  cumulDimancheEtFerie?: boolean;

  // --- Droit local ----------------------------------------------------------

  @IsOptional()
  @IsBoolean()
  droitLocal?: boolean;

  @IsOptional()
  @IsBoolean()
  vendrediSaint?: boolean;

  // --- Heures supplémentaires -----------------------------------------------

  /** Plancher de 10 % imposé par l'article L. 3121-33. */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(10)
  @Max(200)
  majorationHS1Pct?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(10)
  @Max(200)
  majorationHS2Pct?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  seuilBasculeHS?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2000)
  contingentAnnuel?: number;

  // --- Annualisation --------------------------------------------------------

  /**
   * Mille six cent sept heures est un PLAFOND, pas un pivot : un accord peut
   * descendre en dessous (L. 3121-44), jamais monter au-dessus — la Cour de
   * cassation l'a jugé le 11 mai 2016, même lorsque le salarié n'a pas acquis
   * l'intégralité de ses droits à congés.
   */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1607)
  seuilDeclenchementHS?: number;

  /** La durée maximale hebdomadaire absolue est de 48 h (L. 3121-20). */
  @IsOptional()
  @IsInt()
  @Min(35)
  @Max(48)
  limiteHebdoHaute?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(48)
  limiteHebdoBasse?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(90)
  delaiPrevenanceJours?: number;

  // --- Congés du secteur ----------------------------------------------------

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60)
  congesTrimestrielsEducatif?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60)
  congesTrimestrielsAutres?: number;
}

/** Chiffrage d'une vacation avec les règles de l'établissement. */
export class MajorerDto {
  @IsISO8601()
  debut!: string;

  @IsISO8601()
  fin!: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  tauxHoraire?: number;
}

/** Calcul du volume annuel planifiable d'un salarié. */
export class VolumeAnnuelDto {
  @IsInt()
  @Min(2000)
  @Max(2100)
  annee!: number;

  /**
   * La catégorie décide du nombre de jours de congés trimestriels : dix-huit
   * pour le personnel éducatif de la CCN 66, neuf pour l'administratif.
   */
  @IsOptional()
  @IsIn(['EDUCATIF', 'AUTRE'])
  categorie?: 'EDUCATIF' | 'AUTRE';

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(200)
  joursReposHebdo?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60)
  joursCongesPayes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60)
  joursCongesTrimestriels?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(12)
  heuresParJour?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  @Max(1)
  quotite?: number;
}
