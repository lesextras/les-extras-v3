import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Payload interne de création de notification (utilisé par les autres modules). */
export class CreateNotificationDto {
  @IsString()
  @MaxLength(64)
  type!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  body?: string;

  @IsOptional()
  @IsString()
  link?: string;
}
