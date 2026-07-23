import { IsBoolean, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { EmargementSlot } from '@prisma/client';

/** Émargement d'un apprenant pour un créneau (demi-journée). */
export class SignEmargementDto {
  @IsDateString()
  slotDate!: string;

  @IsOptional()
  @IsEnum(EmargementSlot)
  slot?: EmargementSlot;

  @IsOptional()
  @IsBoolean()
  present?: boolean;
}
