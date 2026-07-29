import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ArticleKind, ArticleStatus } from '@prisma/client';

/** Rédaction d'une actualité par un compte (établissement ou intervenant). */
export class CreateArticleDto {
  @IsString()
  @MinLength(5)
  @MaxLength(180)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  excerpt?: string;

  @IsString()
  @MinLength(30, { message: 'Une actualité fait au moins 30 caractères.' })
  @MaxLength(40000)
  content!: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  /** ACTUALITE (par défaut) ou ARTICLE de fond. */
  @IsOptional()
  @IsEnum(ArticleKind)
  kind?: ArticleKind;

  /** DRAFT (par défaut) ou PUBLISHED pour publier immédiatement. */
  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;
}

export class UpdateArticleDto {
  @IsOptional() @IsString() @MinLength(5) @MaxLength(180) title?: string;
  @IsOptional() @IsString() @MaxLength(300) excerpt?: string;
  @IsOptional() @IsString() @MinLength(30) @MaxLength(40000) content?: string;
  @IsOptional() @IsString() coverUrl?: string;
  @IsOptional() @IsString() categoryId?: string | null;
  @IsOptional() @IsEnum(ArticleKind) kind?: ArticleKind;
  @IsOptional() @IsEnum(ArticleStatus) status?: ArticleStatus;
}

/** Filtres du fil public des actualités. */
export class QueryArticlesDto {
  @IsOptional() @IsString() @MaxLength(120) search?: string;
  @IsOptional() @IsString() @MaxLength(120) category?: string;
  @IsOptional() @IsString() accountId?: string;
  /**
   * Section de l'Édublog :
   *  - "editorial" : les articles de fond, d'où qu'ils viennent
   *  - "reseau"    : les actualités, les nouvelles du terrain
   */
  @IsOptional() @IsIn(['editorial', 'reseau']) section?: 'editorial' | 'reseau';
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) take?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) skip?: number;
}

/** Partage d'une actualité publiée sur un réseau. */
export class ShareArticleDto {
  @IsIn(['linkedin'])
  network!: 'linkedin';

  /** Accroche personnelle ajoutée au-dessus du lien. Sinon, le chapô. */
  @IsOptional()
  @IsString()
  @MaxLength(2500)
  comment?: string;
}
