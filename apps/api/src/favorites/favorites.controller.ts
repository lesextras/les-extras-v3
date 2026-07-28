import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/types/request-context';
import { FavoritesService } from './favorites.service';

/** Favoris de l'utilisateur connecté. Aucun accès croisé possible : l'identité
 *  vient du jeton, jamais d'un paramètre de requête. */
@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.favorites.list(user.id);
  }

  @Get('ids')
  ids(@CurrentUser() user: RequestUser) {
    return this.favorites.ids(user.id);
  }

  @Post(':serviceId')
  add(@CurrentUser() user: RequestUser, @Param('serviceId') serviceId: string) {
    return this.favorites.add(user.id, serviceId);
  }

  @Delete(':serviceId')
  remove(@CurrentUser() user: RequestUser, @Param('serviceId') serviceId: string) {
    return this.favorites.remove(user.id, serviceId);
  }
}
