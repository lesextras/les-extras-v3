import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ActionDto } from '../association/dto/espace.dto';

/** Relier le compte courant à un autre espace dont on est membre. */
export class DemandeLiaisonDto {
  @IsString() @IsNotEmpty({ message: "Choisis l'espace à relier." }) @MaxLength(40) accountId!: string;
}

/**
 * Un projet créé depuis une académie. `proprietaire` : `academie`, ou
 * `association:<id>` d'une association reliée. Absent : l'association reliée
 * s'il n'y en a qu'une, sinon l'académie.
 */
export class ProjetAcademieDto extends ActionDto {
  @IsOptional() @IsString() @MaxLength(60) proprietaire?: string;
}

/** Relier une formation (Cours) à un projet. */
export class LienFormationDto {
  @IsString() @IsNotEmpty({ message: 'Choisis une formation.' }) @MaxLength(40) coursId!: string;
}
