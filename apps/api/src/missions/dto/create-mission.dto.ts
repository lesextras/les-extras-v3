import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsISO8601,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
  ValidateNested,
  ValidateIf,
} from "class-validator";
import {
  RENFORT_PUBLICATION_MODES,
  type RenfortPublicationMode,
} from "../mission-slots";

export class MissionSlotDto {
  @IsString()
  date!: string;

  @IsString()
  heureDebut!: string;

  @IsString()
  heureFin!: string;
}

export class MissionPlanningLineDto {
  @IsString()
  dateStart!: string;

  @IsString()
  heureDebut!: string;

  @IsString()
  dateEnd!: string;

  @IsString()
  heureFin!: string;
}

export class CreateMissionDto {
  @IsString()
  @MinLength(2)
  title!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MissionPlanningLineDto)
  planning?: MissionPlanningLineDto[];

  @IsOptional()
  @IsString()
  @IsIn(RENFORT_PUBLICATION_MODES)
  publicationMode?: RenfortPublicationMode;

  @ValidateIf((o) => !o.planning && !o.slots)
  @IsISO8601()
  dateStart?: string;

  @ValidateIf((o) => !o.planning && !o.slots)
  @IsISO8601()
  dateEnd?: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  hourlyRate!: number;

  @IsString()
  @MinLength(2)
  address!: string;

  // isRenfort is accepted for API compatibility but not persisted;
  // all ReliefMission records are renforts by definition.
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === "true")
  isRenfort?: boolean;

  // Extended SOS Renfort fields
  @IsOptional()
  @IsString()
  metier?: string;

  @IsOptional()
  @IsString()
  @IsIn(["JOUR", "NUIT"])
  shift?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MissionSlotDto)
  slots?: MissionSlotDto[];

  // SOS Renfort v2 — contexte clinique
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  establishmentType?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetPublic?: string[];

  @IsOptional()
  @IsString()
  unitSize?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredSkills?: string[];

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === "true")
  diplomaRequired?: boolean;

  // SOS Renfort v2 — logistique
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === "true")
  hasTransmissions?: boolean;

  @ValidateIf((o) => o.hasTransmissions === true)
  @IsString()
  transmissionTime?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  perks?: string[];

  @IsOptional()
  @IsString()
  exactAddress?: string;

  @IsOptional()
  @IsString()
  accessInstructions?: string;
}
