import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class AbonnementPushDto {
  @ApiProperty({ description: "URL du service de push du navigateur" })
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(1000)
  endpoint!: string;

  @ApiProperty({ description: "Clé publique de l'appareil" })
  @IsString()
  @MaxLength(200)
  p256dh!: string;

  @ApiProperty({ description: "Sel d'authentification de l'appareil" })
  @IsString()
  @MaxLength(100)
  auth!: string;

  @ApiPropertyOptional({ description: 'Libellé lisible de l’appareil' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  appareil?: string;
}

export class DesabonnementPushDto {
  @ApiProperty()
  @IsString()
  @MaxLength(1000)
  endpoint!: string;
}
