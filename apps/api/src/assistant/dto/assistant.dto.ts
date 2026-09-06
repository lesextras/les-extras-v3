import { AssistantTrame, PorteeTrame } from '@prisma/client';
import {
  ArrayMaxSize, IsArray, IsBoolean, IsEmail, IsEnum, IsIn, IsOptional, IsString, MaxLength, MinLength, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/** Demande de génération : les notes brutes ne sont JAMAIS persistées. */
export class GenererDto {
  @IsEnum(AssistantTrame)
  trame!: AssistantTrame;

  @IsString()
  @MinLength(20, { message: 'Donnez un peu plus de matière : quelques phrases suffisent.' })
  @MaxLength(8000)
  notes!: string;

  /**
   * Le nom que le professionnel donne lui-même à son écrit, saisi AVANT ses
   * notes. Il ne vaut que pour ECRIT_LIBRE : c'est lui qui remplace le genre
   * et qui décide de la forme du document.
   */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  intitule?: string;

  /** Trame maison à appliquer. Absente = la structure standard du genre. */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  trameMaisonId?: string;

  /**
   * Cases cochées dans l'interface. On ne valide ici que la forme : une clé
   * inconnue est écartée par le catalogue, jamais renvoyée en erreur — une
   * interface restée en cache ne doit pas casser une demande.
   */
  @IsOptional() @IsString() @MaxLength(40)
  destinataire?: string;

  @IsOptional() @IsString() @MaxLength(40)
  registre?: string;

  @IsOptional() @IsString() @MaxLength(40)
  longueur?: string;

  @IsOptional() @IsArray() @ArrayMaxSize(12)
  @IsString({ each: true }) @MaxLength(40, { each: true })
  sections?: string[];
}

/** Enregistrement d'un document APRÈS relecture et validation par l'auteur. */
export class EnregistrerDocumentDto {
  @IsEnum(AssistantTrame)
  trame!: AssistantTrame;

  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @IsString()
  @MinLength(20)
  @MaxLength(20000)
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  trameMaisonId?: string;
}

export class ModifierDocumentDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(20000)
  content?: string;
}

export class FeedbackDto {
  @IsEnum(AssistantTrame)
  trame!: AssistantTrame;

  @IsBoolean()
  utile!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}

/** Générateur d'activités éducatives & thérapeutiques. */
export class ActiviteDto {
  /** Public concerné (ex : « adolescents 12-16 ans en MECS »). */
  @IsString() @MinLength(3) @MaxLength(300)
  publicCible!: string;

  /** Besoins, symptômes ou troubles à travailler (texte libre du pro). */
  @IsString() @MinLength(10) @MaxLength(3000)
  besoins!: string;

  @IsOptional() @IsString() @MaxLength(300)
  objectifs?: string;

  @IsOptional() @IsString() @MaxLength(120)
  duree?: string;

  @IsOptional() @IsString() @MaxLength(60)
  effectif?: string;

  @IsOptional() @IsString() @MaxLength(500)
  contraintes?: string;

  /** Cases cochées : supports, compétences visées, contraintes du terrain. */
  @IsOptional() @IsArray() @ArrayMaxSize(12)
  @IsString({ each: true }) @MaxLength(40, { each: true })
  mediations?: string[];

  @IsOptional() @IsArray() @ArrayMaxSize(12)
  @IsString({ each: true }) @MaxLength(40, { each: true })
  competences?: string[];

  @IsOptional() @IsArray() @ArrayMaxSize(12)
  @IsString({ each: true }) @MaxLength(40, { each: true })
  cadre?: string[];
}

/**
 * Appui scolaire : le troisième outil de LEX. On décrit un enfant qui coince,
 * on repart avec un support utilisable tout de suite.
 */
export class AppuiScolaireDto {
  /** Âge ou classe (ex : « CM1, 9 ans »). */
  @IsString() @MinLength(2) @MaxLength(120)
  niveau!: string;

  /** Matière ou domaine concerné. */
  @IsString() @MinLength(2) @MaxLength(160)
  matiere!: string;

  /** Ce que le professionnel observe, avec ses mots. */
  @IsString() @MinLength(10) @MaxLength(3000)
  difficulte!: string;

  @IsOptional() @IsString() @MaxLength(120)
  temps?: string;

  @IsOptional() @IsString() @MaxLength(500)
  moyens?: string;

  @IsOptional() @IsArray() @ArrayMaxSize(12)
  @IsString({ each: true }) @MaxLength(40, { each: true })
  supports?: string[];

  @IsOptional() @IsArray() @ArrayMaxSize(12)
  @IsString({ each: true }) @MaxLength(40, { each: true })
  obstacles?: string[];

  @IsOptional() @IsString() @MaxLength(40)
  posture?: string;
}

/**
 * UN TOUR DE DIALOGUE — ET IL EST VALIDE (25/08/2026).
 *
 * `historique` etait declare `@IsOptional()` seul. Or `@IsOptional()` suffit
 * a mettre la propriete en liste blanche : elle traversait donc la
 * validation sans qu'aucune regle ne s'applique. Sur la route publique du
 * chatbot, `{content: 123}` faisait planter le pseudonymiseur en 500, et un
 * historique long partait tel quel chez le moteur — a nos frais.
 */
export class TourDialogueDto {
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @IsString() @MaxLength(4000)
  content!: string;
}

/** Bot conversationnel (site public et dashboard). */
export class ChatDto {
  @IsString() @MinLength(1) @MaxLength(2000)
  message!: string;

  @IsOptional() @IsArray() @ArrayMaxSize(8)
  @ValidateNested({ each: true }) @Type(() => TourDialogueDto)
  historique?: TourDialogueDto[];

  /** Champ-piège anti-robot (public uniquement). */
  @IsOptional() @IsString()
  website?: string;
}

/** Un tour de dialogue avec LEX le GAPiste. */
export class GapisteDto {
  @IsString() @MinLength(2) @MaxLength(3000)
  message!: string;

  @IsOptional() @IsArray() @ArrayMaxSize(8)
  @ValidateNested({ each: true }) @Type(() => TourDialogueDto)
  historique?: TourDialogueDto[];

  /** Situation du GAP à laquelle le dialogue se rattache (facultatif). */
  @IsOptional()
  contexte?: {
    titre?: string;
    situation?: string;
    tente?: string;
    metier?: string;
    publicVise?: string;
  };
}

/** Aide au remplissage d'une fiche atelier/formation depuis un brief. */
export class FicheDto {
  @IsString() @MaxLength(20)
  type!: 'ATELIER' | 'FORMATION';

  @IsString() @MinLength(15) @MaxLength(3000)
  brief!: string;
}

/** Import d'un modèle d'écrit : fichier déposé OU texte collé. */
export class ImporterTrameDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nom!: string;

  /** Genre d'écrit auquel la trame se rattache (facultatif). */
  @IsOptional()
  @IsEnum(AssistantTrame)
  genre?: AssistantTrame;

  /** PERSONNELLE par défaut ; ETABLISSEMENT réservé aux responsables. */
  @IsOptional()
  @IsEnum(PorteeTrame)
  portee?: PorteeTrame;

  /** Le modèle collé, quand la personne préfère ne pas déposer de fichier. */
  @IsOptional()
  @IsString()
  @MaxLength(24000)
  texte?: string;
}

export class ModifierTrameDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nom?: string;

  @IsOptional()
  @IsEnum(AssistantTrame)
  genre?: AssistantTrame;

  @IsOptional()
  @IsEnum(PorteeTrame)
  portee?: PorteeTrame;
}

/** Export d'un écrit vers un fichier téléchargeable. */
export class ExporterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  titre!: string;

  @IsString()
  @MinLength(20)
  @MaxLength(20000)
  contenu!: string;

  @IsIn(['docx', 'pdf'])
  format!: 'docx' | 'pdf';
}

/**
 * Envoi de l'écrit par courriel, à une adresse choisie par l'auteur.
 *
 * Le document part en pièce jointe. Ni l'adresse ni le contenu ne sont
 * conservés : la route les emploie et les oublie — c'est la même règle que
 * pour les notes, et elle ne souffre pas d’exception parce qu’un courriel
 * serait plus commode à tracer.
 */
export class EnvoyerDocumentDto extends ExporterDto {
  @IsEmail({}, { message: 'Adresse e-mail invalide.' })
  @MaxLength(180)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;
}
