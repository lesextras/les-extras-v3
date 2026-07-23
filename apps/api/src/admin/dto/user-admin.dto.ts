import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { GlobalRole, UserStatus } from '@prisma/client';

/** Création d'un utilisateur depuis le back-office admin. */
export class CreateUserDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEnum(GlobalRole) role?: GlobalRole;
  @IsOptional() @IsEnum(UserStatus) status?: UserStatus;
}

/** Édition d'un utilisateur (identité + rôle + statut). */
export class UpdateUserDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEnum(GlobalRole) role?: GlobalRole;
  @IsOptional() @IsEnum(UserStatus) status?: UserStatus;
}
