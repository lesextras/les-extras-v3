import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Bannissement d'un utilisateur avec motif optionnel (journalisé en notif). */
export class BanUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
