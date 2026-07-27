import { Type } from "class-transformer";
import { IsDateString, IsInt, IsOptional, IsString, Min } from "class-validator";

export class BookServiceDto {
  @IsDateString({}, { message: "La date de réservation est invalide." })
  date!: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Le nombre de participants doit être un nombre entier." })
  @Min(1, { message: "Le nombre de participants doit être supérieur ou égal à 1." })
  nbParticipants?: number;
}
