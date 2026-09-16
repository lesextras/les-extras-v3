import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FormatIntervention, ServiceCategory } from '@prisma/client';
import { FaqItemDto, PriceExtraDto } from '../../services/dto/create-service.dto';

/**
 * Correction d'une fiche par l'administrateur.
 *
 * ⚠ CE DTO A ÉTÉ ÉLARGI LE 3/09/2026, ET C'EST UN CHANGEMENT DE DOCTRINE.
 *
 * Il ne portait que la présentation (titre, description, ville, images) au
 * motif qu'« un administrateur corrige une coquille ». En pratique, dix des
 * treize ateliers du catalogue sont arrivés par l'import du catalogue
 * WordPress, où les champs pédagogiques n'existaient pas : ils sont donc
 * publiés sans durée, sans nombre de participants, sans matériel, sans
 * prérequis et sans créneaux. Leurs titulaires sont quatre intervenants
 * différents, dont trois extérieurs à l'association. Avec l'ancien périmètre,
 * l'administration ne pouvait RIEN y faire — la seule façon de compléter une
 * fiche était de se connecter au compte de son auteur.
 *
 * Le périmètre couvre donc désormais toute la fiche, à trois exceptions
 * assumées :
 *   - `status` reste à la route de modération (`PATCH .../moderate`), qui
 *     journalise le passage d'un statut à l'autre. Le faire ici ferait
 *     disparaître cette trace ;
 *   - `slug` n'est pas modifiable : c'est l'adresse publique de la fiche, déjà
 *     indexée et partagée. On ne casse pas une URL depuis un écran de
 *     correction ;
 *   - `accountId` non plus : changer le titulaire d'une fiche, c'est changer
 *     qui la vend et qui l'anime.
 *
 * Toute modification passe par `AdminService.updateService`, qui journalise la
 * liste des champs touchés (`admin.service.updated`).
 */
export class UpdateServiceAdminDto {
  // --- Présentation --------------------------------------------------------
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(20000) description?: string;
  @IsOptional() @IsString() @MaxLength(120) city?: string;
  /** Départements couverts (codes INSEE) — voir `common/territoires.ts`. */
  @IsOptional() @IsArray() @IsString({ each: true }) departements?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) images?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) publicTargets?: string[];
  @IsOptional() @IsString() @MaxLength(200) publicTarget?: string;

  /**
   * RECLASSEMENT atelier ↔ formation. C'est la catégorie qui décide du
   * catalogue d'affichage : FORMATION sort la fiche de /ateliers et la range
   * avec les formations. Sans ce champ, des formations déposées comme
   * « atelier » restaient mélangées aux ateliers du réseau, sans aucun moyen
   * de les remettre au bon endroit autrement qu'en base.
   */
  @IsOptional() @IsEnum(ServiceCategory) category?: ServiceCategory;

  /** Catégorie éditable (taxonomie `Category`), celle qui s'affiche. */
  @IsOptional() @IsString() categoryId?: string;

  // --- Repères pratiques ---------------------------------------------------
  /** Libellé libre historique : « 2H », « une demi-journée ». */
  @IsOptional() @IsString() @MaxLength(120) duration?: string;
  /** Durée normalisée, pour le tri et les filtres. */
  @IsOptional() @IsInt() @Min(0) durationMinutes?: number;
  /** COLLECTIF (atelier) ou INDIVIDUEL (renfort personnalisé). */
  @IsOptional() @IsEnum(FormatIntervention) format?: FormatIntervention;
  @IsOptional() @IsInt() @Min(1) maxParticipants?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) timeSlots?: string[];

  // --- Contenu pédagogique -------------------------------------------------
  @IsOptional() @IsString() @MaxLength(500) material?: string;
  @IsOptional() @IsString() @MaxLength(500) prerequisites?: string;
  @IsOptional() @IsString() @MaxLength(5000) objectives?: string;
  @IsOptional() @IsString() @MaxLength(5000) methodology?: string;
  @IsOptional() @IsString() @MaxLength(5000) evaluation?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FaqItemDto)
  faq?: FaqItemDto[];

  // --- Commercial ----------------------------------------------------------
  /**
   * Le prix est modifiable ici, et il ne l'était pas. Deux fiches du catalogue
   * affichent un montant qui contredit leur propre description (« TARIFS SELON
   * PRESTATION » sur une fiche à 300 €) : c'est exactement le genre d'écart
   * qu'une administration doit pouvoir reprendre. Le prix reste celui que
   * l'intervenant touche intégralement — la commission est à zéro.
   */
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) price?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceExtraDto)
  priceExtras?: PriceExtraDto[];

  @IsOptional() @IsInt() @Min(0) creditCost?: number;

  // --- Mise en avant -------------------------------------------------------
  @IsOptional() @IsBoolean() featured?: boolean;
  @IsOptional() @IsBoolean() verified?: boolean;
  @IsOptional() @IsBoolean() qualiopi?: boolean;
}
