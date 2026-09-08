import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { AccountType, GlobalRole, UserStatus } from '@prisma/client';

export class ChercherDto {
  @IsOptional() @IsString() @MaxLength(120) q?: string;
  @IsOptional() @IsEnum(AccountType) type?: AccountType;
}

export class ModifierCompteDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(200) name?: string;
  @IsOptional() @IsString() @MaxLength(200) legalName?: string;
  @IsOptional() @IsString() @MaxLength(30) siret?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsString() @MaxLength(200) city?: string;
}

export class ModifierPersonneDto {
  @IsOptional() @IsEnum(GlobalRole, { message: "Ce rôle n'existe pas." }) role?: GlobalRole;
  @IsOptional() @IsEnum(UserStatus, { message: "Cet état n'existe pas." }) status?: UserStatus;
}
