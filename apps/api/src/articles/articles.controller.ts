import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, Redirect, UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ArticlesService } from './articles.service';
import { LinkedinService } from './linkedin.service';
import {
  CreateArticleDto, QueryArticlesDto, ShareArticleDto, UpdateArticleDto,
} from './dto/article.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import type { RequestUser } from '../common/types/request-context';

interface AccountCtx { id: string }

/**
 * Actualités : chaque compte — établissement, intervenant, sous-compte — rédige
 * et publie. Tout membre peut écrire : c'est un fil de vie, pas un back-office.
 */
@Controller('articles')
export class ArticlesController {
  constructor(
    private readonly articles: ArticlesService,
    private readonly linkedin: LinkedinService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ── Fil PUBLIC (sans connexion) ─────────────────────────────────────────

  @Get('feed')
  feed(@Query() query: QueryArticlesDto) {
    return this.articles.feed(query);
  }

  @Get('feed/:slug')
  bySlug(@Param('slug') slug: string) {
    return this.articles.bySlug(slug);
  }

  // ── Retour de connexion LinkedIn (appelé par LinkedIn, sans en-tête) ────

  @Get('linkedin/callback')
  @Redirect()
  async callback(@Query('code') code: string, @Query('state') state: string) {
    const web = (this.config.get<string>('WEB_PUBLIC_URL') ?? 'https://app.les-extras.fr')
      .replace(/\/$/, '');
    try {
      const { sub } = await this.jwt.verifyAsync<{ sub: string }>(state);
      await this.linkedin.exchangeCode(code, sub);
      return { url: `${web}/dashboard/actualites?linkedin=ok` };
    } catch {
      return { url: `${web}/dashboard/actualites?linkedin=erreur` };
    }
  }

  // ── Espace de rédaction (authentifié + compte actif) ─────────────────────

  @Get()
  @UseGuards(JwtAuthGuard, AccountGuard)
  findMine(@CurrentAccount() account: AccountCtx) {
    return this.articles.findMine(account.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AccountGuard)
  create(
    @CurrentAccount() account: AccountCtx,
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateArticleDto,
  ) {
    return this.articles.create(account.id, user.id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AccountGuard)
  update(
    @Param('id') id: string,
    @CurrentAccount() account: AccountCtx,
    @Body() dto: UpdateArticleDto,
  ) {
    return this.articles.update(id, account.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AccountGuard)
  remove(@Param('id') id: string, @CurrentAccount() account: AccountCtx) {
    return this.articles.remove(id, account.id);
  }

  // ── LinkedIn ────────────────────────────────────────────────────────────

  @Get('linkedin/status')
  @UseGuards(JwtAuthGuard)
  status(@CurrentUser() user: RequestUser) {
    return this.linkedin.status(user.id);
  }

  /** Renvoie l'URL de consentement (state = jeton court signé). */
  @Get('linkedin/authorize')
  @UseGuards(JwtAuthGuard)
  async authorize(@CurrentUser() user: RequestUser) {
    const state = await this.jwt.signAsync({ sub: user.id }, { expiresIn: '10m' });
    return { url: this.linkedin.authorizeUrl(state) };
  }

  @Delete('linkedin/connexion')
  @UseGuards(JwtAuthGuard)
  disconnect(@CurrentUser() user: RequestUser) {
    return this.linkedin.disconnect(user.id);
  }

  @Post(':id/share')
  @UseGuards(JwtAuthGuard, AccountGuard)
  async share(
    @Param('id') id: string,
    @CurrentAccount() account: AccountCtx,
    @CurrentUser() user: RequestUser,
    @Body() dto: ShareArticleDto,
  ) {
    const article = await this.articles.forSharing(id, account.id);
    const { urn, url } = await this.linkedin.share(user.id, article, dto.comment);
    await this.articles.markShared(id, urn);
    return { ok: true, urn, url };
  }
}
