import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
  MinLength,
} from 'class-validator';

export class RechercheStructureDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  q!: string;
}

export class RattacherStructureDto {
  /** Structure déjà déclarée sur la plateforme. Prioritaire sur le reste. */
  @IsOptional()
  @IsString()
  structureId?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  nom?: string;

  @IsOptional()
  @Matches(/^\d{9}$/, { message: 'Un numéro SIREN compte exactement neuf chiffres.' })
  siren?: string;

  /**
   * ⚠ C'EST CE NUMÉRO-LÀ QUE LES GENS ONT SOUS LA MAIN, pas le SIREN : il est
   * sur l'avis de situation, sur les factures, et c'est celui qu'on leur
   * demande partout ailleurs. Le service en déduit le SIREN (ses neuf premiers
   * chiffres), plutôt que de faire saisir deux numéros dont l'un contient
   * l'autre — et qui finiraient par se contredire.
   */
  @IsOptional()
  @Matches(/^\d{14}$/, { message: 'Un numéro SIRET compte exactement quatorze chiffres.' })
  siret?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  formeJuridique?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  adresse?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  ville?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  codePostal?: string;

  /**
   * Vrai quand la fiche vient de l'annuaire public et n'a pas été retapée.
   * Posé par le formulaire quand la personne a CHOISI une entité dans la liste,
   * jamais quand elle a saisi le nom à la main.
   */
  @IsOptional()
  @IsBoolean()
  verifiee?: boolean;
}
