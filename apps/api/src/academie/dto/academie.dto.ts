import {
  IsBoolean,
  IsIn,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { EtatQualiopi, OrigineReclamation, StatutReclamation, TypeVeille } from '@prisma/client';

/**
 * OUVRIR L'ESPACE D'UNE ACADÉMIE.
 *
 * Le nom suffit. Le SIREN, s'il est donné, sert à retrouver la structure ;
 * le NDA reste facultatif — une académie en cours de déclaration doit pouvoir
 * ouvrir son espace et le renseigner ensuite. Avec `autre`, on en ajoute une
 * DE PLUS : une même personne peut piloter plusieurs organismes.
 */
export class OuvrirAcademieDto {
  @IsString()
  @MinLength(2, { message: "Écris le nom de ton académie." })
  @MaxLength(160)
  nom!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{9}$/, { message: 'Le SIREN compte neuf chiffres.' })
  siren?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{14}$/, { message: 'Le SIRET compte quatorze chiffres.' })
  siret?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  nda?: string;

  @IsOptional()
  @IsEnum(EtatQualiopi, { message: "Cet état de certification n'existe pas." })
  qualiopi?: EtatQualiopi;

  @IsOptional()
  @IsBoolean()
  autre?: boolean;
}

/** La fiche de l'organisme. Tous les champs sont facultatifs : on ne contraint personne. */
export class ModifierAcademieDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(160) nom?: string;
  @IsOptional() @IsString() @MaxLength(30) sigle?: string;

  @IsOptional() @IsString() @MaxLength(20) nda?: string;
  @IsOptional() @IsDateString({}, { message: 'Cette date n\'est pas valide.' }) ndaDeposeLe?: string;
  @IsOptional() @IsString() @MaxLength(80) dreets?: string;

  @IsOptional() @IsString() @Matches(/^\d{9}$/, { message: 'Le SIREN compte neuf chiffres.' }) siren?: string;
  @IsOptional() @IsString() @Matches(/^\d{14}$/, { message: 'Le SIRET compte quatorze chiffres.' }) siret?: string;
  @IsOptional() @IsString() @MaxLength(10) ape?: string;

  @IsOptional() @IsString() @MaxLength(200) adresse?: string;
  @IsOptional() @IsString() @Matches(/^\d{5}$/, { message: 'Le code postal compte cinq chiffres.' }) codePostal?: string;
  @IsOptional() @IsString() @MaxLength(120) commune?: string;
  @IsOptional() @IsString() @MaxLength(30) telephone?: string;
  @IsOptional() @IsEmail({}, { message: "Cette adresse e-mail ne semble pas valide." }) courriel?: string;
  @IsOptional() @IsString() @MaxLength(200) siteWeb?: string;

  @IsOptional() @IsEnum(EtatQualiopi) qualiopi?: EtatQualiopi;
  @IsOptional() @IsString() @MaxLength(120) certificateur?: string;
  @IsOptional() @IsDateString() auditPrevuLe?: string;
  @IsOptional() @IsDateString() certifieDu?: string;
  @IsOptional() @IsDateString() certifieAu?: string;

  @IsOptional() @IsString() @MaxLength(120) referentHandicap?: string;
  @IsOptional() @IsString() @MaxLength(120) referentPedagogique?: string;

  @IsOptional() @IsString() @MaxLength(300) resume?: string;
  @IsOptional() @IsString() @MaxLength(20000) presentation?: string;
}

export class EtapeAcademieFaiteDto {
  @IsBoolean()
  faite!: boolean;
}

/** Une entrée du journal de veille — critère 6. */
export class VeilleDto {
  @IsEnum(TypeVeille, { message: "Ce type de veille n'existe pas." })
  type!: TypeVeille;

  @IsDateString({}, { message: "Cette date n'est pas valide." })
  date!: string;

  @IsString() @MinLength(2) @MaxLength(200) titre!: string;

  @IsOptional() @IsString() @MaxLength(200) source?: string;
  @IsOptional() @IsString() @MaxLength(500) lien?: string;
  @IsOptional() @IsString() @MaxLength(4000) resume?: string;
  @IsOptional() @IsString() @MaxLength(4000) consequence?: string;
}

/**
 * Modifier une entrée de veille. On ne dérive pas de `VeilleDto` : rendre
 * facultatif un champ hérité demande un `declare`, et un décorateur posé sur un
 * champ `declare` n'est pas émis — la validation serait silencieusement fausse.
 * On redéclare donc, c'est plus long mais c'est vrai.
 */
export class ModifierVeilleDto {
  @IsOptional() @IsEnum(TypeVeille, { message: "Ce type de veille n'existe pas." }) type?: TypeVeille;
  @IsOptional() @IsDateString({}, { message: "Cette date n'est pas valide." }) date?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(200) titre?: string;
  @IsOptional() @IsString() @MaxLength(200) source?: string;
  @IsOptional() @IsString() @MaxLength(500) lien?: string;
  @IsOptional() @IsString() @MaxLength(4000) resume?: string;
  @IsOptional() @IsString() @MaxLength(4000) consequence?: string;
}

/** Une réclamation — critère 7. */
export class ReclamationDto {
  @IsDateString({}, { message: "Cette date n'est pas valide." })
  recueLe!: string;

  @IsOptional() @IsEnum(OrigineReclamation) origine?: OrigineReclamation;
  @IsOptional() @IsString() @MaxLength(160) auteur?: string;

  @IsString() @MinLength(2) @MaxLength(200) objet!: string;

  @IsOptional() @IsString() @MaxLength(4000) detail?: string;
  @IsOptional() @IsString() @MaxLength(4000) traitement?: string;
  @IsOptional() @IsDateString() clotureeLe?: string;
  @IsOptional() @IsEnum(StatutReclamation) statut?: StatutReclamation;
}

/** Modifier une réclamation. Même raison qu'au-dessus : on redéclare. */
export class ModifierReclamationDto {
  @IsOptional() @IsDateString({}, { message: "Cette date n'est pas valide." }) recueLe?: string;
  @IsOptional() @IsEnum(OrigineReclamation) origine?: OrigineReclamation;
  @IsOptional() @IsString() @MaxLength(160) auteur?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(200) objet?: string;
  @IsOptional() @IsString() @MaxLength(4000) detail?: string;
  @IsOptional() @IsString() @MaxLength(4000) traitement?: string;
  @IsOptional() @IsDateString() clotureeLe?: string;
  @IsOptional() @IsEnum(StatutReclamation) statut?: StatutReclamation;
}

/**
 * LA PREUVE D'UN INDICATEUR QUALIOPI.
 *
 * Rien n'est obligatoire : on peut poser un intitulé sans lien, un lien sans
 * intitulé, ou seulement changer l'état. « Sans objet » est un état légitime —
 * tous les indicateurs ne s'appliquent pas à tous les organismes.
 */
export class NotePreuveQualiopiDto {
  @IsOptional()
  @IsIn(['A_FAIRE', 'DEPOSEE', 'VALIDEE', 'SANS_OBJET'], { message: "Cet état de preuve n'existe pas." })
  etat?: 'A_FAIRE' | 'DEPOSEE' | 'VALIDEE' | 'SANS_OBJET';

  @IsOptional() @IsString() @MaxLength(300) intitule?: string;
  @IsOptional() @IsString() @MaxLength(500) lien?: string;
}
