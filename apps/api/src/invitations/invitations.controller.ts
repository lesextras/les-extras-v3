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
 * ⚠ LE GARDE DE RÔLE A ÉTÉ RETIRÉ DES ROUTES D'INVITATION (16/09/2026), ET
 * CE N'EST PAS UN OUBLI.
 *
 * Il exigeait OWNER ou ADMIN, c'est-à-dire la direction. Un chef de service
 * arrivé seul — le cas que ce produit doit servir en priorité — ne pouvait donc
 * inviter personne tant que sa direction n'avait pas ouvert de compte. Il
 * n'avait rien à faire sur la plateforme.
 *
 * Le droit d'inviter est désormais une CAPACITÉ (`INVITER_MEMBRES`), vérifiée
 * dans le service, où l'on sait aussi rabattre le niveau, les droits et les
 * services à ce que l'invitant détient réellement. Un garde de rôle ne sait
 * rien faire de tout cela : il aurait laissé passer un ADMIN invitant hors de
 * son périmètre, et refusé un responsable invitant dans le sien.
 */
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  /**
   * L'invitation telle que la personne invitée la lit AVANT d'accepter : qui
   * l'invite, dans quel service, et ce que son acceptation rendra visible.
   * Publique (jeton en main) : l'invité n'a pas encore de compte.
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

  // --- Gestion, bornée au périmètre de qui demande (voir le service) ---

  @Get()
  @UseGuards(JwtAuthGuard, AccountGuard)
  list(@CurrentAccount() account: RequestAccount, @CurrentUser() user: RequestUser) {
    return this.invitations.list(account, user);
  }

  /**
   * Import d'équipe : invitations en masse (le CSV est lu côté client,
   * l'API reçoit une liste déjà structurée). Chaque ligne est traitée
   * indépendamment : une adresse invalide n'annule pas les autres.
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
