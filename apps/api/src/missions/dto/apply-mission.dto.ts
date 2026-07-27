import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class ApplyMissionDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  motivation?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(15)
  @Max(45)
  proposedRate?: number;
}
