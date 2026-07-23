import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Candidature d'un FREELANCE à une mission (crée un Booking REQUESTED). */
export class CandidateMissionDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;
}
