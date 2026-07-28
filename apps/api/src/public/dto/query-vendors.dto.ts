import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/** Filtres de l'annuaire public des intervenants. */
export class QueryVendorsDto {
  @IsOptional() @IsString() @MaxLength(120) search?: string;
  @IsOptional() @IsString() @MaxLength(120) city?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(60) take?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) skip?: number;
}
