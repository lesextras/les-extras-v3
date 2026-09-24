import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestAccount, RequestUser } from '../common/types/request-context';

/**
 * Invitations : réservées aux espaces Piloter (association, académie), où la
 * direction et l'administration gèrent les droits d'accès de leur équipe.
 *
 * Le contrôle vit dans le service (`assertPeutInviter`) : type de compte ET
 * rôle OWNER ou ADMIN. Un garde de rôle seul ne suffirait pas, puisque
 * `AccountRolesGuard` laisse tout passer sur un compte Les Extras, où les rôles
 * n'existent plus. Sur Les Extras, « 1 compte = 1 personne » (24/09/2026) :
 * la réponse est un 403 qui le dit.
 */
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  /**
   * L'invitation telle que la personne invitée la lit AVANT d'accepter : qui
   * l'invite, et dans quel espace. Publique (jeton en main) : l'invité n'a pas
   * encore de compte.
   */
  @Get('apercu')
  apercu(@Query('token') token: string) {
    return this.invitations.apercu(token ?? '');
  }

  /**
   * Accepter une invitation : nécessite seulement d'être authentifié
   * (l'invité rejoint un compte dont il n'est pas encore membre).
   */
  @Post('accept')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  accept(@CurrentUser() user: RequestUser, @Body() dto: AcceptInvitationDto) {
    return this.invitations.accept(user, dto.token);
  }

  // --- Gestion : espace Piloter, direction ou administration (voir le service) ---

  @Get()
  @UseGuards(JwtAuthGuard, AccountGuard)
  list(@CurrentAccount() account: RequestAccount, @CurrentUser() user: RequestUser) {
    return this.invitations.list(account, user);
  }

  /**
   * Invitations en masse (le CSV est lu côté client, l'API reçoit une liste
   * déjà structurée). Chaque ligne est traitée indépendamment : une adresse
   * invalide n'annule pas les autres.
   */
  @Post('lot')
  @UseGuards(JwtAuthGuard, AccountGuard)
  async createLot(
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Body() dto: { lignes: CreateInvitationDto[] },
  ) {
    const lignes = (dto?.lignes ?? []).slice(0, 200);
    const resultat = { envoyees: 0, ignorees: [] as { email: string; raison: string }[] };
    for (const ligne of lignes) {
      try {
        await this.invitations.create(account, user, ligne);
        resultat.envoyees += 1;
      } catch (e) {
        resultat.ignorees.push({ email: ligne?.email ?? '?', raison: (e as Error).message });
      }
    }
    return resultat;
  }

  @Post()
  @UseGuards(JwtAuthGuard, AccountGuard)
  create(
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.invitations.create(account, user, dto);
  }

  @Post(':id/resend')
  @UseGuards(JwtAuthGuard, AccountGuard)
  resend(
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.invitations.resend(account, user, id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AccountGuard)
  revoke(
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.invitations.revoke(account, user, id);
  }
}
