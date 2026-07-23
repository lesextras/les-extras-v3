import { IsBoolean, IsOptional, IsString } from 'class-validator';

/** Création d'une catégorie (taxonomie éditable). */
export class CreateCategoryDto {
  @IsString() title!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() parentId?: string;
  @IsOptional() @IsBoolean() archived?: boolean;
}

/** Mise à jour d'une catégorie. */
export class UpdateCategoryDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() parentId?: string | null;
  @IsOptional() @IsBoolean() archived?: boolean;
}
