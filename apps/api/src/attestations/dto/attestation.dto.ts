import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * COMMANDER UNE ATTESTATION DE SUIVI.
 *
 * ⚠ AUCUN COMPTE N'EST DEMANDÉ : les parcours gratuits se suivent sur la
 * plateforme pédagogique de l'association, sans compte Les Extras. Ce qu'on
 * demande est le strict nécessaire pour imprimer le document et l'envoyer.
 */
export class CommanderAttestationDto {
  /** Identifiant ou adresse lisible de la formation suivie. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  formation!: string;

  @IsEmail()
  @MaxLength(180)
  email!: string;

  /** ⚠ Le prénom et le nom S'IMPRIMENT sur le document : ils sont requis. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  prenom!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  nom!: string;

  /**
   * « Je demande la délivrance immédiate et je reconnais perdre mon droit de
   * rétractation. »
   *
   * ⚠ DÉCOCHÉE PAR DÉFAUT, ET ELLE DOIT LE RESTER. Le droit de rétractation de
   * quatorze jours ne s'éteint que sur demande EXPRESSE (art. L221-25 et
   * L221-28, 1° c. conso). Une case pré-cochée ne serait pas une demande, et
   * la renonciation serait inopposable.
   */
  @IsOptional()
  @IsBoolean()
  renonciationRetractation?: boolean;
}

export class AnnulerAttestationDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  motif?: string;
}
