import {
  IsArray,
  IsBoolean,
  IsIn,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ModaliteCours, NiveauCours, StatutCours, StatutVente, TypeLecon, TypeRemise } from '@prisma/client';

/* ------------------------------------------------------------------ cours */

export class CreerCoursDto {
  @IsString() @MinLength(2, { message: 'Donne un titre à ton cours.' }) @MaxLength(200) titre!: string;
  @IsOptional() @IsString() @MaxLength(300) sousTitre?: string;
}

export class ModifierCoursDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(200) titre?: string;
  @IsOptional() @IsString() @MinLength(3) @MaxLength(80) slug?: string;
  @IsOptional() @IsString() @MaxLength(300) sousTitre?: string;
  @IsOptional() @IsString() @MaxLength(8000) description?: string;
  @IsOptional() @IsString() @MaxLength(600) imageUrl?: string;
  @IsOptional() @IsString() @MaxLength(600) bandeAnnonceUrl?: string;
  @IsOptional() @IsEnum(NiveauCours) niveau?: NiveauCours;
  @IsOptional() @IsString() @MaxLength(80) categorie?: string;
  @IsOptional() @IsArray() objectifs?: string[];
  @IsOptional() @IsString() @MaxLength(2000) prerequis?: string;
  @IsOptional() @IsString() @MaxLength(2000) pourQui?: string;
  @IsOptional() @IsInt() @Min(0) @Max(100000) dureeMinutes?: number;
  @IsOptional() @IsInt() @Min(0) @Max(10000000) prixCents?: number;
  @IsOptional() @IsInt() @Min(0) @Max(10000000) prixBarreCents?: number;
  @IsOptional() @IsBoolean() gratuit?: boolean;
  @IsOptional() @IsBoolean() certificat?: boolean;
  @IsOptional() @IsEnum(StatutCours) statut?: StatutCours;

  /* La modalité : en ligne, en salle, en visio, ou les deux. */
  @IsOptional() @IsEnum(ModaliteCours) modalite?: ModaliteCours;
  @IsOptional() @IsString() @MaxLength(300) lieu?: string;
  @IsOptional() @IsString() @MaxLength(600) lienVisio?: string;
  @IsOptional() @IsString() @MaxLength(2000) accesHandicap?: string;

  /* Ce que règle l'atelier. */
  @IsOptional() @IsBoolean() lectureOrdonnee?: boolean;
  @IsOptional() @IsInt() @Min(0) @Max(100000) placesMax?: number;
  @IsOptional() @IsInt() @Min(0) @Max(100) tvaPourcent?: number;
  @IsOptional() @IsInt() @Min(1) @Max(24) echeances?: number;
  @IsOptional() @IsString() @MaxLength(200) seoTitre?: string;
  @IsOptional() @IsString() @MaxLength(400) seoDescription?: string;
  @IsOptional() @IsBoolean() commentairesActifs?: boolean;

  /** La fiche programme (Formation) que porte cette formation ; `null` pour la détacher. */
  @IsOptional()
  @IsString()
  formationId?: string | null;
}

/* ----------------------------------------------------------- commentaires */

/** Ce que l'organisme fait d'un commentaire : il répond, ou il le masque. */
export class CommentaireDto {
  @IsOptional() @IsString() @MaxLength(4000) reponse?: string;
  @IsOptional() @IsBoolean() masque?: boolean;
}

/** Ce qu'écrit un apprenant sous une leçon. */
export class EcrireCommentaireDto {
  @IsOptional() @IsString() @MaxLength(40) leconId?: string;
  @IsString() @MinLength(2) @MaxLength(4000) message!: string;
}

/* -------------------------------------------------------- chapitres, leçons */

export class ChapitreDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(200) titre?: string;
  @IsOptional() @IsString() @MaxLength(1000) resume?: string;
  /** Un chapitre en brouillon reste écrit, mais ne se lit pas. */
  @IsOptional() @IsBoolean() publie?: boolean;
}

/**
 * AJOUTER UN CONTENU PÉDAGOGIQUE.
 *
 * Un seul geste pour tout ce qui se pose dans une formation. Sans
 * `chapitreId`, le contenu se range directement dans la formation : le
 * chapitre est facultatif.
 */
export class AjouterContenuDto {
  @IsOptional() @IsIn(['chapitre', 'lecon', 'quiz', 'devoir', 'live']) genre?: 'chapitre' | 'lecon' | 'quiz' | 'devoir' | 'live';
  @IsOptional() @IsString() @MaxLength(40) chapitreId?: string;
  @IsOptional() @IsString() @MaxLength(200) titre?: string;
  @IsOptional() @IsString() @MaxLength(1000) resume?: string;
}

export class LeconDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(200) titre?: string;
  @IsOptional() @IsEnum(TypeLecon) type?: TypeLecon;
  @IsOptional() @IsString() @MaxLength(60000) contenu?: string;
  @IsOptional() @IsString() @MaxLength(600) videoUrl?: string;
  @IsOptional() @IsString() @MaxLength(600) fichierUrl?: string;
  @IsOptional() @IsInt() @Min(0) @Max(100000) dureeMinutes?: number;
  @IsOptional() @IsBoolean() apercu?: boolean;
  /** Une leçon en brouillon reste écrite, mais ne se lit pas. */
  @IsOptional() @IsBoolean() publie?: boolean;
  /** Les blocs sont relus par `nettoyerBlocs` : leur forme change d'un type à l'autre. */
  @IsOptional() blocs?: unknown;
  /** Le quiz est relu par `nettoyerQuiz` : sa forme change d'une question à l'autre. */
  @IsOptional() quiz?: unknown;
}

/** Le nouvel ordre : la liste des identifiants, dans l'ordre voulu. */
export class ReordonnerDto {
  @IsArray() ids!: string[];
}

/** Déplacer une leçon d'un chapitre à l'autre — ou hors de tout chapitre. */
export class DeplacerLeconDto {
  @IsOptional() @IsString() @MaxLength(40) chapitreId?: string;
  @IsOptional() @IsInt() @Min(0) position?: number;
}

/* ------------------------------------------------------------- apprenants */

export class InscrireDto {
  @IsString() @MaxLength(200) email!: string;
  @IsOptional() @IsString() @MaxLength(120) nom?: string;
  @IsOptional() @IsString() @MaxLength(120) prenom?: string;
}

/* ------------------------------------------------------------------ packs */

export class PackDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(200) titre?: string;
  @IsOptional() @IsString() @MinLength(3) @MaxLength(80) slug?: string;
  @IsOptional() @IsString() @MaxLength(4000) description?: string;
  @IsOptional() @IsString() @MaxLength(600) imageUrl?: string;
  @IsOptional() @IsInt() @Min(0) @Max(10000000) prixCents?: number;
  @IsOptional() @IsArray() coursIds?: string[];
  @IsOptional() @IsEnum(StatutCours) statut?: StatutCours;
}

/* ------------------------------------------------------------ codes promo */

export class CodePromoDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(40) code?: string;
  @IsOptional() @IsEnum(TypeRemise) type?: TypeRemise;
  @IsOptional() @IsInt() @Min(1) @Max(10000000) valeur?: number;
  @IsOptional() @IsArray() coursIds?: string[];
  @IsOptional() @IsDateString() debuteLe?: string;
  @IsOptional() @IsDateString() expireLe?: string;
  @IsOptional() @IsInt() @Min(1) @Max(100000) usageMax?: number;
  @IsOptional() @IsBoolean() actif?: boolean;
}

/* ----------------------------------------------------------------- ventes */

export class VenteDto {
  @IsOptional() @IsString() @MaxLength(40) coursId?: string;
  @IsOptional() @IsString() @MaxLength(40) packId?: string;
  @IsString() @MaxLength(200) email!: string;
  @IsOptional() @IsString() @MaxLength(120) nom?: string;
  @IsInt() @Min(0) @Max(10000000) montantCents!: number;
  @IsOptional() @IsString() @MaxLength(40) codePromo?: string;
  @IsOptional() @IsString() @MaxLength(40) affiliation?: string;
  @IsOptional() @IsEnum(StatutVente) statut?: StatutVente;
  @IsOptional() @IsString() @MaxLength(60) moyen?: string;
}

/* ------------------------------------------------------- classes virtuelles */

export class ClasseDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(200) titre?: string;
  @IsOptional() @IsString() @MaxLength(4000) description?: string;
  @IsOptional() @IsDateString() debut?: string;
  @IsOptional() @IsDateString() fin?: string;
  @IsOptional() @IsString() @MaxLength(600) lien?: string;
  @IsOptional() @IsInt() @Min(1) @Max(10000) placesMax?: number;
  @IsOptional() @IsString() @MaxLength(40) coursId?: string;
}

/* ------------------------------------------------------------- la vitrine */

export class EcoleDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(120) nom?: string;
  @IsOptional() @IsString() @MinLength(3) @MaxLength(60) slug?: string;
  @IsOptional() @IsString() @MaxLength(200) sousTitre?: string;
  @IsOptional() @IsString() @MaxLength(8000) presentation?: string;
  @IsOptional() @IsString() @MaxLength(600) logoUrl?: string;
  @IsOptional() @IsString() @MaxLength(600) banniereUrl?: string;
  @IsOptional() @IsString() @MaxLength(9) couleur?: string;
  @IsOptional() @IsString() @MaxLength(200) contactEmail?: string;
  @IsOptional() @IsString() @MaxLength(20000) cgv?: string;
  @IsOptional() @IsString() @MaxLength(20000) mentions?: string;
  @IsOptional() @IsBoolean() publiee?: boolean;
}

/* ------------------------------------------------------------- affiliation */

export class AffilieDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(120) nom?: string;
  @IsOptional() @IsString() @MaxLength(200) email?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(40) code?: string;
  @IsOptional() @IsInt() @Min(0) @Max(90) commissionPourcent?: number;
  @IsOptional() @IsBoolean() actif?: boolean;
}

/* --------------------------------------------------------------- le public */

/** Ce qu'envoie quelqu'un qui s'inscrit depuis la page publique d'un cours. */
export class RejoindreDto {
  @IsString() @MaxLength(200) email!: string;
  @IsOptional() @IsString() @MaxLength(120) nom?: string;
  @IsOptional() @IsString() @MaxLength(120) prenom?: string;
  @IsOptional() @IsString() @MaxLength(40) codePromo?: string;
  @IsOptional() @IsString() @MaxLength(40) affiliation?: string;
}

/** Une leçon cochée, ou un quiz rendu. */
export class AvancerDto {
  @IsOptional() @IsBoolean() faite?: boolean;
  @IsOptional() reponses?: unknown;
}
