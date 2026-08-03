import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class RetenirDto {
  /**
   * Note de service, visible du seul établissement : « connaît le groupe des
   * ados », « accepte les nuits », « préfère être prévenue la veille ».
   *
   * Ce champ existe pour la mémoire de l'organisation, pas pour un jugement
   * sur la personne — c'est aussi pourquoi le vivier n'a pas de pendant
   * négatif : un registre d'intervenants « à éviter », invisible de
   * l'intéressé, serait un fichier de réputation.
   */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class RappelerDto {
  /**
   * Les comptes à solliciter. Bornés : un rappel s'adresse aux quelques
   * personnes qui connaissent la maison, pas à une liste de diffusion.
   */
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  intervenantAccountIds!: string[];
}
