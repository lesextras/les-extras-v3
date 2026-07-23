import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { JalonStatus, TutoratStatus } from '@prisma/client';

export class UpsertTutoratDto {
  @IsOptional() @IsString() tutorId?: string;
  @IsOptional() @IsString() @MaxLength(2000) projetAvenir?: string;
  @IsOptional() @IsEnum(TutoratStatus) status?: TutoratStatus;
}

export class CreateEntretienDto {
  @IsDateString() date!: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}

export class CreateJalonDto {
  @IsString() @MaxLength(200) label!: string;
  @IsOptional() @IsDateString() dueDate?: string;
}

export class UpdateJalonDto {
  @IsOptional() @IsString() @MaxLength(200) label?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsEnum(JalonStatus) status?: JalonStatus;
}
