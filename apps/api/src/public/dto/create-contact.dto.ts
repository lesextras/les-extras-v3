import { HoneypotDto } from './honeypot';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Demande de contact déposée depuis le site public (sans authentification). */
export class CreateContactDto extends HoneypotDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  type?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(4000)
  content!: string;

  /** Origine (utm_source / référent). */
  @IsOptional() @IsString() @MaxLength(120) source?: string;
}
