import { IsEnum, IsOptional, IsString } from 'class-validator';
import { GlobalRole, UserStatus } from '@prisma/client';

/** Filtres de la liste des utilisateurs (back-office). */
export class QueryUsersDto {
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsEnum(GlobalRole)
  role?: GlobalRole;

  @IsOptional()
  @IsString()
  search?: string;
}
