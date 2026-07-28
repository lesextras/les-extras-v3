import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ArticleStatus } from '@prisma/client';

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
  @IsOptional() @IsEnum(ArticleStatus) status?: ArticleStatus;
}

/** Filtres du fil public des actualités. */
export class QueryArticlesDto {
  @IsOptional() @IsString() @MaxLength(120) search?: string;
  @IsOptional() @IsString() @MaxLength(120) category?: string;
  @IsOptional() @IsString() accountId?: string;
  /**
   * Section de l'Édublog :
   *  - "editorial" : articles de fond publiés par l'équipe (accountId null)
   *  - "reseau"    : actualités publiées par les comptes du réseau
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
