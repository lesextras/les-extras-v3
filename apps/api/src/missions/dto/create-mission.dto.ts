import {
  IsIn,
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsNumber,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ArrayMaxSize, IsArray } from 'class-validator';
import { CibleDiffusion, MissionCategory, ModeAttribution } from '@prisma/client';

/**
 * Création d'une mission RenforTeam par un ESTABLISHMENT.
 * La mission est créée en statut DRAFT ; la diffusion se fait via /publish.
 */
export class CreateMissionDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @IsString()
  @MinLength(10)
  description!: string;

  @IsOptional()
  @IsEnum(MissionCategory)
  category?: MissionCategory;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  job?: string;

  @IsISO8601()
  startDate!: string;

  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  hourlyRate?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  headcount?: number;

  @IsOptional()
  @IsBoolean()
  emergency?: boolean;

  /** 'HEBDO' : l'occurrence de la semaine suivante est creee et publiee automatiquement. */
  @IsOptional()
  @IsIn(['HEBDO'])
  recurrence?: string;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  /**
   * Identifiant du fichier déposé via /files. Prend le pas sur l'adresse web
   * saisie à la main : c'est le mode recommandé.
   */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  attachmentId?: string;

  /**
   * ⚠ DÉPRÉCIÉ ET IGNORÉ (24/09/2026, « 1 compte = 1 personne ») : plus de
   * services internes. Accepté pour qu'un ancien écran ne reçoive pas un 400.
   */
  @IsOptional()
  @IsString()
  orgUnitId?: string;

  /**
   * AUTOMATIQUE : le premier qui accepte a la mission (défaut historique).
   * FILE_ENGAGEMENT : l'établissement valide chaque profil, dans l'ordre
   * d'arrivée des engagements.
   */
  @IsOptional()
  @IsEnum(ModeAttribution)
  modeAttribution?: ModeAttribution;

  /**
   * À qui l'offre est adressée : RESEAU, CONNUS ou SELECTION (intervenants).
   * `UNITE`, encore dans l'énumération, retombe sur RESEAU.
   */
  @IsOptional()
  @IsEnum(CibleDiffusion)
  cibleDiffusion?: CibleDiffusion;

  /** ⚠ DÉPRÉCIÉ ET IGNORÉ (24/09/2026) : plus de salariés à désigner. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(500)
  destinatairesSalaries?: string[];

  /** Cible SELECTION : identifiants des comptes intervenants désignés. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(500)
  destinatairesIntervenants?: string[];
}
