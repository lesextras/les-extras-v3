import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestAccount, RequestUser } from '../common/types/request-context';
import { EnveloppesService } from './enveloppes.service';
import { AccepterEnveloppeDto, InviterEnveloppeDto, ModifierEnveloppeDto } from './dto/enveloppes.dto';

/**
 * Enveloppes LEX : un compte paie les générations d'autres personnes.
 *
 * ⚠ `apercu/:jeton` est PUBLIQUE (on la lit avant de se connecter) : elle ne
 * rend jamais l'adresse invitée en clair, et elle est plafonnée.
 * ⚠ Les routes « miennes » et « accepter » ne demandent pas de compte actif :
 * une enveloppe appartient à une PERSONNE, quel que soit le compte ouvert.
 */
@Controller('lex/enveloppes')
export class EnveloppesController {
  constructor(private readonly enveloppes: EnveloppesService) {}

  @Get('apercu/:jeton')
  @Throttle({ default: { limit: 30, ttl: 3_600_000 } })
  apercu(@Param('jeton') jeton: string) {
    return this.enveloppes.apercu(jeton);
  }

  @Get('miennes')
  @UseGuards(JwtAuthGuard)
  miennes(@CurrentUser() user: RequestUser) {
    return this.enveloppes.miennes(user);
  }

  @Post('accepter')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 3_600_000 } })
  accepter(@CurrentUser() user: RequestUser, @Body() dto: AccepterEnveloppeDto) {
    return this.enveloppes.accepter(user, dto.jeton);
  }

  @Delete('miennes/:id')
  @UseGuards(JwtAuthGuard)
  quitter(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.enveloppes.quitter(user, id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, AccountGuard)
  lister(@CurrentAccount() account: RequestAccount) {
    return this.enveloppes.lister(account);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AccountGuard)
  @Throttle({ default: { limit: 60, ttl: 3_600_000 } })
  inviter(@CurrentUser() user: RequestUser, @CurrentAccount() account: RequestAccount, @Body() dto: InviterEnveloppeDto) {
    return this.enveloppes.inviter(user, account, dto);
  }

  @Post(':id/lien')
  @UseGuards(JwtAuthGuard, AccountGuard)
  nouveauLien(@CurrentUser() user: RequestUser, @CurrentAccount() account: RequestAccount, @Param('id') id: string) {
    return this.enveloppes.nouveauLien(user, account, id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AccountGuard)
  modifier(@CurrentAccount() account: RequestAccount, @Param('id') id: string, @Body() dto: ModifierEnveloppeDto) {
    return this.enveloppes.modifier(account, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AccountGuard)
  retirer(@CurrentAccount() account: RequestAccount, @Param('id') id: string) {
    return this.enveloppes.retirer(account, id);
  }
}
