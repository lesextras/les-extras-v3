import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';
import { FormationStatus, FormationType, SessionStatus } from '@prisma/client';

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
