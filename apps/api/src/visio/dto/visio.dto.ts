import { IsInt, IsISO8601, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/**
 * ⚠⚠ AUCUN CHAMP DE MOTIF, ET C'EST LE POINT LE PLUS IMPORTANT DE CE FICHIER.
 *
 * Le ValidationPipe global est en `forbidNonWhitelisted` : tout champ absent
 * de ces DTO part en 400. C'est donc ici que se tient la frontière entre un
 * rendez-vous de rééducation et un dossier de santé. Ajouter « motif »,
 * « symptômes » ou « compte rendu » ferait entrer des données de santé (art. 9
 * RGPD) dans une base qui n'est pas hébergée chez un hébergeur certifié HDS —
 * et rendrait fausse la phrase que la page publique affiche à chaque famille.
 *
 * Ce qui doit se dire se dit pendant la séance, ou dans la messagerie du
 * dossier, qui a son propre avertissement sur les données d'usagers.
 */
export class PlanifierVisioDto {
  @IsString()
  @MaxLength(40)
  bookingId!: string;

  /** Date et heure du rendez-vous, en ISO 8601. */
  @IsISO8601()
  debutPrevu!: string;

  /**
   * Durée prévue.
   *
   * ⚠ Bornée à 15 minutes et 4 heures. Le plancher évite le rendez-vous d'une
   * minute posé par erreur, qui se fermerait pendant qu'on s'installe ; le
   * plafond évite la salle ouverte toute la journée, qui redeviendrait le lien
   * permanent que ce dispositif refuse.
   */
  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(240)
  dureeMinutes?: number;
}

export class AnnulerVisioDto {
  /**
   * Le motif est facultatif, LIBRE et affiché tel quel à l'autre participant.
   *
   * ⚠ C'est un motif d'ANNULATION — « je suis souffrante », « la famille a
   * reporté » —, jamais un motif de consultation. L'intitulé du champ le dit,
   * et l'écran qui le saisit le rappelle.
   */
  @IsOptional()
  @IsString()
  @MaxLength(300)
  motif?: string;
}

export class RejoindreVisioDto {
  /**
   * Le nom affiché aux autres participants.
   *
   * ⚠ IL EST AFFICHÉ EN CLAIR DANS LA SALLE, donc on demande un PRÉNOM. Le
   * service le nettoie et le borne à 40 caractères avant de le signer dans le
   * jeton.
   */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  prenom?: string;
}
