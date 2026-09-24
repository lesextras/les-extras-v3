import { IsBoolean, IsEmail, IsIn, IsInt, IsOptional, IsString, Length, Max, MaxLength, Min } from 'class-validator';

export class InviterEnveloppeDto {
  @IsEmail({}, { message: 'Cette adresse e-mail n’est pas valide.' })
  @MaxLength(200)
  email!: string;

  @IsInt()
  @Min(1, { message: 'Le plafond est d’au moins une génération par mois.' })
  @Max(1000, { message: 'Le plafond est de 1 000 générations par mois au plus.' })
  plafondMensuel!: number;

  @IsOptional()
  @IsBoolean()
  partageTrames?: boolean;
}

export class ModifierEnveloppeDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  plafondMensuel?: number;

  @IsOptional()
  @IsBoolean()
  partageTrames?: boolean;

  /** Suspendre ou reprendre ; le retrait passe par DELETE. */
  @IsOptional()
  @IsIn(['ACTIVE', 'SUSPENDUE'])
  statut?: 'ACTIVE' | 'SUSPENDUE';
}

export class AccepterEnveloppeDto {
  @IsString()
  @Length(20, 200)
  jeton!: string;
}
