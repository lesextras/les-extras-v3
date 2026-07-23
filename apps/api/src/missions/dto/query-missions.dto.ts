import { IsEnum, IsISO8601, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { MissionStatus, MissionVisibility } from '@prisma/client';

/** Filtres du marketplace des missions (statut / visibilité / ville / dates). */
export class QueryMissionsDto {
  @IsOptional()
  @IsEnum(MissionStatus)
  status?: MissionStatus;

  @IsOptional()
  @IsEnum(MissionVisibility)
  visibility?: MissionVisibility;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  skip?: number;
}
