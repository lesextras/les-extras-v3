import { IsJWT } from 'class-validator';

export class VerifyEmailDto {
  @IsJWT({ message: 'Token de vérification invalide.' })
  token!: string;
}
