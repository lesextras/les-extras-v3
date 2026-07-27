import { IsOptional, IsString, Matches } from "class-validator";

export class FindMissionsQueryDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "date must use YYYY-MM-DD format",
  })
  date?: string;

  @IsOptional()
  @IsString()
  city?: string;
}
