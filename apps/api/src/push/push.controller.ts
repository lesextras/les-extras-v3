import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/types/request-context';
import { PushService } from './push.service';
import { AbonnementPushDto, DesabonnementPushDto } from './dto/push.dto';

@Controller('push')
export class PushController {
  constructor(private readonly push: PushService) {}

  /** Publique : le navigateur en a besoin avant même de demander la permission. */
  @Get('cle')
  async cle() {
    return { clePublique: await this.push.clePublique() };
  }

  @Post('abonnement')
  @UseGuards(JwtAuthGuard)
  abonner(@CurrentUser() user: RequestUser, @Body() dto: AbonnementPushDto) {
    return this.push.abonner(user.id, dto);
  }

  @Delete('abonnement')
  @UseGuards(JwtAuthGuard)
  desabonner(@CurrentUser() user: RequestUser, @Body() dto: DesabonnementPushDto) {
    return this.push.desabonner(user.id, dto.endpoint);
  }

  @Get('appareils')
  @UseGuards(JwtAuthGuard)
  appareils(@CurrentUser() user: RequestUser) {
    return this.push.mesAppareils(user.id);
  }

  /** Envoi d'essai, pour vérifier que le téléphone reçoit bien. */
  @Post('essai')
  @UseGuards(JwtAuthGuard)
  async essai(@CurrentUser() user: RequestUser) {
    await this.push.notifier(user.id, {
      titre: 'Les Extras',
      corps: 'Les notifications fonctionnent sur cet appareil.',
      lien: '/dashboard',
      tag: 'essai',
    });
    return { ok: true };
  }
}
