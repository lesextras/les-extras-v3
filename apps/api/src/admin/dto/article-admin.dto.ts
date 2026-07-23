import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ArticleStatus } from '@prisma/client';

/** Création d'un article de contenu. */
export class CreateArticleDto {
  @IsString() title!: string;
  @IsOptional() @IsString() excerpt?: string;
  @IsOptional() @IsString() content?: string;
  @IsOptional() @IsString() coverUrl?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsEnum(ArticleStatus) status?: ArticleStatus;
}

/** Mise à jour d'un article. */
export class UpdateArticleDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() excerpt?: string;
  @IsOptional() @IsString() content?: string;
  @IsOptional() @IsString() coverUrl?: string;
  @IsOptional() @IsString() categoryId?: string | null;
  @IsOptional() @IsEnum(ArticleStatus) status?: ArticleStatus;
}
