import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ServiceCategory } from '@prisma/client';

/** Filtres du catalogue public des ateliers. */
export class QueryServicesDto {
  @IsOptional()
  @IsEnum(ServiceCategory)
  category?: ServiceCategory;

  @IsOptional()
  @IsString()
  city?: string;

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
