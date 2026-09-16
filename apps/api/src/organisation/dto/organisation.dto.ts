import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Capacite, NiveauResponsabilite } from '@prisma/client';

export class DeclarerPosteDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  poste?: string;

  @IsOptional()
  @IsBoolean()
  cadre?: boolean;

  /**
   * Déclarer RESPONSABLE ne demande l'autorisation de personne. Déclarer
   * DIRECTION crée une demande : c'est le seul niveau qui donne la vue sur des
   * équipes constituées par d'autres.
   */
  @IsOptional()
  @IsEnum(NiveauResponsabilite)
  niveau?: NiveauResponsabilite;

  /**
   * CE QUE LA PERSONNE DÉCLARE POUVOIR ENGAGER.
   *
   * ⚠ Elle se l'accorde elle-même, et c'est un choix assumé : le premier compte
   * d'un établissement n'est pas forcément celui d'un cadre, et exiger une
   * confirmation d'en haut bloquerait tout le monde en attendant une direction
   * qui n'existe peut-être pas encore.
   *
   * Ce qui rend la chose tenable, ce n'est pas un contrôle, c'est la
   * TRAÇABILITÉ : la déclaration figure sur chaque devis et chaque réservation
   * émis, avec le poste. Un établissement voit donc immédiatement qui a engagé
   * quoi, et à quel titre. Et comme il n'y a aucun paiement sur la plateforme,
   * ces droits n'engagent jamais d'argent — ils disent seulement si le bouton
   * affiché est « Réserver » ou « Demander un devis ».
   */
  @IsOptional()
  @IsArray()
  @IsEnum(Capacite, { each: true })
  capacites?: Capacite[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  justification?: string;
}

export class ChangerNiveauDto {
  @IsEnum(NiveauResponsabilite)
  niveau!: NiveauResponsabilite;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  poste?: string;

  @IsOptional()
  @IsBoolean()
  cadre?: boolean;
}

export class AccorderCapacitesDto {
  /** Liste COMPLÈTE des droits accordés : elle remplace la précédente. */
  @IsArray()
  @IsEnum(Capacite, { each: true })
  capacites!: Capacite[];
}

export class DemanderNiveauDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  justification?: string;
}

export class VisibiliteDto {
  @IsBoolean()
  masque!: boolean;
}

export class DeciderNiveauDto {
  @IsBoolean()
  accepter!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  motifRefus?: string;
}

export class RejoindreEtablissementDto {
  @IsString()
  etablissementId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
