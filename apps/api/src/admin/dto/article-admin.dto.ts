import { IsEnum, IsOptional, IsString, IsDateString, Matches } from 'class-validator';
import { ArticleKind, ArticleStatus } from '@prisma/client';

/** Création d'un article de contenu. */
export class CreateArticleDto {
  @IsString() title!: string;
  @IsOptional() @IsString() excerpt?: string;
  @IsOptional() @IsString() content?: string;
  @IsOptional() @IsString() coverUrl?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsEnum(ArticleKind) kind?: ArticleKind;
  @IsOptional() @IsEnum(ArticleStatus) status?: ArticleStatus;
  /** Date de publication réelle (import d'un article existant, rétro-datage). */
  @IsOptional() @IsDateString() publishedAt?: string;
}

/** Mise à jour d'un article. */
export class UpdateArticleDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() excerpt?: string;
  @IsOptional() @IsString() content?: string;
  @IsOptional() @IsString() coverUrl?: string;
  @IsOptional() @IsString() categoryId?: string | null;
  @IsOptional() @IsEnum(ArticleKind) kind?: ArticleKind;
  @IsOptional() @IsEnum(ArticleStatus) status?: ArticleStatus;
  @IsOptional() @IsDateString() publishedAt?: string;
  /**
   * L'adresse de l'article. Modifiable par l'administration depuis le
   * 28/09/2026 (un article portait « freelance » jusque dans son slug).
   * ⚠ Une adresse déjà indexée qui change doit recevoir une redirection 308
   * dans next.config.mjs, sinon ses liens tombent sur « introuvable ».
   */
  @IsOptional()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'Adresse invalide : minuscules, chiffres et tirets seulement.' })
  slug?: string;
}
