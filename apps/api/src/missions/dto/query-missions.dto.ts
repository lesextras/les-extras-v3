import { IsEnum, IsISO8601, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { MissionCategory, MissionVisibility } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

/** Filtres du marketplace des missions (statut / visibilité / ville / dates). */
export class QueryMissionsDto {
  // `status` a été RETIRÉ volontairement : la marketplace ne sert que les
  // missions publiées, et le ValidationPipe global (whitelist +
  // forbidNonWhitelisted) transforme désormais `?status=DRAFT` en 400 plutôt
  // qu'en fuite de brouillons. Ne pas le réintroduire « pour la souplesse ».

  @IsOptional()
  @IsEnum(MissionVisibility)
  visibility?: MissionVisibility;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  /** Avec postalCode : ne garder que les missions a moins de X km. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(300)
  rayonKm?: number;

  @IsOptional()
  @IsString()
  job?: string;

  @IsOptional()
  @IsEnum(MissionCategory)
  category?: MissionCategory;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;
}
