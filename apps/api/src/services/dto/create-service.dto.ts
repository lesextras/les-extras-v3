import { Type } from "class-transformer";
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  IsEnum,
  IsArray,
  ValidateNested,
} from "class-validator";
import { ServiceStatus, ServiceType, PricingType } from "@prisma/client";

export class ServiceSlotDto {
  @IsString()
  date!: string;

  @IsString()
  heureDebut!: string;

  @IsString()
  heureFin!: string;
}

export class CreateServiceDto {
  @IsEnum(ServiceType)
  @IsOptional()
  type?: ServiceType;

  @IsEnum(ServiceStatus)
  @IsOptional()
  status?: ServiceStatus;

  @IsString()
  @MinLength(2)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(30)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsEnum(PricingType)
  @IsOptional()
  pricingType?: PricingType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  publicCible?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceSlotDto)
  slots?: ServiceSlotDto[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pricePerParticipant?: number;

  @IsOptional()
  @IsString()
  materials?: string;

  @IsOptional()
  @IsString()
  objectives?: string;

  @IsOptional()
  @IsString()
  methodology?: string;

  @IsOptional()
  @IsString()
  evaluation?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  scheduleInfo?: string;
}
