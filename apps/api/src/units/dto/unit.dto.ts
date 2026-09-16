import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MotifDemandeService, PorteeService } from '@prisma/client';

export class CreateUnitDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateUnitDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class AssignMemberDto {
  @IsString()
  membershipId!: string;

  @IsOptional()
  @IsString()
  unitId?: string;

  /**
   * RATTACHEMENT (« je travaille dans ce service ») ou ENCADREMENT
   * (« j'encadre ce service »). Ce ne sont pas la même chose : un coordinateur
   * peut être rattaché au Pôle jour et encadrer le Pôle jour ET le SESSAD.
   */
  @IsOptional()
  @IsEnum(PorteeService)
  portee?: PorteeService;
}

export class RetirerServiceDto {
  @IsString()
  membershipId!: string;

  @IsString()
  orgUnitId!: string;

  @IsEnum(PorteeService)
  portee!: PorteeService;
}

export class VerifierNomDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  nom!: string;
}

export class DemandeServiceDto {
  @IsString()
  orgUnitId!: string;

  /** REJOINDRE : la demande part à celui qui tient le service.
   *  SIGNALEMENT : elle part aux Extras (service obsolète, mal nommé, orphelin). */
  @IsEnum(MotifDemandeService)
  motif!: MotifDemandeService;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;
}

export class DeciderDemandeServiceDto {
  @IsBoolean()
  accepter!: boolean;
}
