import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FormationStatus, FormationType, SessionStatus } from '@prisma/client';
import { FaqItemDto } from '../../services/dto/create-service.dto';

/**
 * LA VITRINE D'UNE FORMATION — les sept champs qui manquaient.
 *
 * ⚠⚠ RELEVÉ LE 16/09/2026, ET C'ÉTAIT LE PLUS COÛTEUX DES DÉFAUTS DE
 * FORMULAIRE. Le modèle `Formation` porte depuis longtemps `images`, `city`,
 * `methodology`, `evaluation`, `faq`, `publicTargets` et `durationMinutes` —
 * et AUCUN d'eux n'était dans les DTO de l'administration. Le ValidationPipe
 * global étant en `forbidNonWhitelisted`, toute requête qui les contenait
 * partait en 400 : ces champs n'étaient donc remplissables QUE par un script
 * de seed, c'est-à-dire par un commit.
 *
 * Conséquence concrète, visible au catalogue : une carte de formation
 * s'affichait sans photo, sans ville et sans public filtrable à côté d'une
 * carte d'atelier qui porte les trois. C'est exactement l'écart que Siham
 * avait relevé le 3/09 — on avait corrigé la CARTE, pas le moyen de la
 * remplir.
 *
 * ⚠ LES LONGUEURS SONT CELLES DE `UpdateServiceAdminDto` : les deux
 * formulaires décrivent la même chose au lecteur, et deux plafonds différents
 * pour le même champ produiraient une fiche acceptée d'un côté, refusée de
 * l'autre.
 */

/**
 * Création d'un programme de formation depuis le back-office ADMIN.
 * Par défaut CERTIFIANTE (catalogue OF ADéPA — Qualiopi). Si INTERNE,
 * `cpfEligible` et `certifying` sont forcés à false côté service.
 */
export class CreateFormationAdminDto {
  @IsString() title!: string;
  @IsOptional() @IsEnum(FormationType) type?: FormationType;
  @IsOptional() @IsString() summary?: string;
  @IsOptional() @IsString() objectives?: string;
  @IsOptional() @IsString() prerequisites?: string;
  @IsOptional() @IsString() program?: string;
  @IsOptional() @IsString() targetAudience?: string;
  @IsOptional() @IsInt() @Min(1) durationHours?: number;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsBoolean() cpfEligible?: boolean;
  @IsOptional() @IsBoolean() certifying?: boolean;
  @IsOptional() @IsString() certificationName?: string;
  @IsOptional() @IsString() edofRef?: string;
  /** Vitrine : sans image ni ville, une formation ne se vend pas en ligne. */
  @IsOptional() @IsArray() @IsString({ each: true }) images?: string[];
  @IsOptional() @IsString() @MaxLength(120) city?: string;
  /**
   * Étiquettes de public, filtrables au catalogue. `targetAudience` est un
   * paragraphe : il se lit, il ne se filtre pas. Les deux coexistent.
   */
  @IsOptional() @IsArray() @IsString({ each: true }) publicTargets?: string[];
  /**
   * ⚠ LA DURÉE EN MINUTES N'EST PAS UN CONFORT. `durationHours` est un entier :
   * une mini-formation de 45 minutes y vaut 0 (durée effacée) ou 1 (durée
   * fausse sur une fiche que des financeurs lisent). Les deux champs
   * coexistent, la carte affiche celui qui est rempli.
   */
  @IsOptional() @IsInt() @Min(1) durationMinutes?: number;
  @IsOptional() @IsString() @MaxLength(5000) methodology?: string;
  @IsOptional() @IsString() @MaxLength(5000) evaluation?: string;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FaqItemDto)
  faq?: FaqItemDto[];
  /**
   * MINI-FORMATION EN LIGNE ET GRATUITE.
   *
   * Le ValidationPipe global est en `forbidNonWhitelisted` : sans ces deux
   * champs ici, l'ecran d'administration ne peut PAS corriger une fiche
   * gratuite — la requete part en 400 des qu'elle les contient. Les fiches
   * sont creees par `prisma/seed-mini-formations.js`, mais elles doivent
   * rester modifiables a la main : une URL de plateforme qui change ne doit
   * pas obliger a un commit.
   *
   * `enrollUrl` est valide comme une URL http(s) : le seul bouton de la fiche
   * y mene, et une adresse mal saisie donne un bouton mort sur la page
   * publique — le genre de defaut que personne ne remarque avant des mois.
   */
  @IsOptional() @IsBoolean() freeOnline?: boolean;
  @IsOptional() @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  enrollUrl?: string;
  @IsOptional() @IsEnum(FormationStatus) status?: FormationStatus;
  /** Compte OF propriétaire (fallback si l'admin ne dispose d'aucun compte). */
  @IsOptional() @IsString() ownerAccountId?: string;
}

/** Mise à jour d'un programme (contenu + changement de statut). */
export class UpdateFormationAdminDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsEnum(FormationType) type?: FormationType;
  @IsOptional() @IsString() summary?: string;
  @IsOptional() @IsString() objectives?: string;
  @IsOptional() @IsString() prerequisites?: string;
  @IsOptional() @IsString() program?: string;
  @IsOptional() @IsString() targetAudience?: string;
  @IsOptional() @IsInt() @Min(1) durationHours?: number;
  @IsOptional() @IsString() categoryId?: string | null;
  @IsOptional() @IsBoolean() cpfEligible?: boolean;
  @IsOptional() @IsBoolean() certifying?: boolean;
  @IsOptional() @IsString() certificationName?: string;
  @IsOptional() @IsString() edofRef?: string;
  /** Vitrine : sans image ni ville, une formation ne se vend pas en ligne. */
  @IsOptional() @IsArray() @IsString({ each: true }) images?: string[];
  @IsOptional() @IsString() @MaxLength(120) city?: string;
  /**
   * Étiquettes de public, filtrables au catalogue. `targetAudience` est un
   * paragraphe : il se lit, il ne se filtre pas. Les deux coexistent.
   */
  @IsOptional() @IsArray() @IsString({ each: true }) publicTargets?: string[];
  /**
   * ⚠ LA DURÉE EN MINUTES N'EST PAS UN CONFORT. `durationHours` est un entier :
   * une mini-formation de 45 minutes y vaut 0 (durée effacée) ou 1 (durée
   * fausse sur une fiche que des financeurs lisent). Les deux champs
   * coexistent, la carte affiche celui qui est rempli.
   */
  @IsOptional() @IsInt() @Min(1) durationMinutes?: number;
  @IsOptional() @IsString() @MaxLength(5000) methodology?: string;
  @IsOptional() @IsString() @MaxLength(5000) evaluation?: string;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FaqItemDto)
  faq?: FaqItemDto[];
  /**
   * MINI-FORMATION EN LIGNE ET GRATUITE.
   *
   * Le ValidationPipe global est en `forbidNonWhitelisted` : sans ces deux
   * champs ici, l'ecran d'administration ne peut PAS corriger une fiche
   * gratuite — la requete part en 400 des qu'elle les contient. Les fiches
   * sont creees par `prisma/seed-mini-formations.js`, mais elles doivent
   * rester modifiables a la main : une URL de plateforme qui change ne doit
   * pas obliger a un commit.
   *
   * `enrollUrl` est valide comme une URL http(s) : le seul bouton de la fiche
   * y mene, et une adresse mal saisie donne un bouton mort sur la page
   * publique — le genre de defaut que personne ne remarque avant des mois.
   */
  @IsOptional() @IsBoolean() freeOnline?: boolean;
  @IsOptional() @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  enrollUrl?: string;
  @IsOptional() @IsEnum(FormationStatus) status?: FormationStatus;

  /**
   * ⚠⚠ LE PRIX DE L'ATTESTATION — C'EST L'INTERRUPTEUR DE LA VENTE.
   *
   * Nul (ou zéro) = la vente est FERMÉE pour cette fiche : le bouton d'achat
   * n'est pas monté à l'écran et `POST /attestations` refuse. Un montant en
   * centimes = la vente est ouverte, pour cette fiche et elle seule.
   *
   * ⚠ SANS CE CHAMP ICI, LE TUNNEL ENTIER ÉTAIT INUTILISABLE — et c'est un
   * défaut que j'ai livré le 16/09/2026 en construisant le tunnel : le
   * ValidationPipe global est en `forbidNonWhitelisted`, donc un champ absent
   * du DTO fait partir la requête en 400. Aucune route ne pouvait poser le
   * prix : la décision d'ouvrir la vente, même prise, ne pouvait pas
   * s'exécuter autrement qu'en écrivant directement en base.
   *
   * ⚠ LE PLAFOND N'EST PAS DÉCORATIF. L'unité est le CENTIME : quelqu'un qui
   * tape « 20 » en pensant vingt euros ouvre la vente à 0,20 € — l'écran
   * d'administration saisit donc des euros et convertit. Dans l'autre sens,
   * 20 000 centimes tapés pour 20 € vendrait le document 200 €. Le plafond de
   * 200 € arrête la faute la plus coûteuse des deux, celle qui débite
   * réellement quelqu'un.
   *
   * ⚠ RAPPEL AVANT D'OUVRIR : vendre à un particulier oblige à nommer dans les
   * CGV un médiateur de la consommation référencé par la CECMC (art. L612-1
   * c. conso). C'est une décision de l'association, pas un réglage.
   */
  @IsOptional() @IsInt() @Min(0) @Max(20_000) attestationPrixCents?: number | null;
}

/** Planification d'une session datée pour un programme. */
export class CreateSessionAdminDto {
  @IsOptional() @IsString() title?: string;
  @IsDateString() startDate!: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsInt() @Min(1) maxSeats?: number;
  @IsOptional() @IsNumber() priceHt?: number;
  /** Remuneration du formateur, hors taxes — distincte du prix de vente. */
  @IsOptional() @IsNumber() trainerFeeHt?: number;
  @IsOptional() @IsString() trainerId?: string;
  @IsOptional() @IsEnum(SessionStatus) status?: SessionStatus;
}

/**
 * Correction d'une session existante par l'administration plateforme.
 * L'admin pouvait créer une session mais jamais la corriger ensuite : une
 * erreur de prix ou de date publiée restait figée, sauf à être membre du
 * compte organisme propriétaire — ce que l'administration n'est pas.
 */
export class UpdateSessionAdminDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsInt() @Min(1) maxSeats?: number;
  @IsOptional() @IsNumber() priceHt?: number;
  /** Remuneration du formateur, hors taxes — distincte du prix de vente. */
  @IsOptional() @IsNumber() trainerFeeHt?: number;
  @IsOptional() @IsString() trainerId?: string;
  @IsOptional() @IsEnum(SessionStatus) status?: SessionStatus;
}
