import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

/**
 * Bascule salarié → intervenant.
 *
 * Le contact est obligatoire et doit être PERSONNEL : une activité
 * indépendante ne se pilote pas depuis la messagerie et la ligne de son
 * employeur. Le service refuse explicitement les coordonnées de la structure.
 */
export class DevenirIntervenantDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name!: string;

  @IsEmail({}, { message: 'Indiquez une adresse e-mail personnelle valide.' })
  @MaxLength(180)
  contactEmail!: string;

  @IsString()
  @Matches(/^(?:\+33|0)\s?[1-9](?:[\s.-]?\d{2}){4}$/, {
    message: 'Indiquez un numéro de téléphone français valide (personnel).',
  })
  @MaxLength(30)
  phone!: string;

  @IsOptional()
  @IsString()
  sourceAccountId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  serviceIds?: string[];
}
