import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AccountRole } from '@prisma/client';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { AccountRolesGuard } from '../common/guards/account-roles.guard';
import { AccountRoles } from '../common/decorators/account-roles.decorator';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestAccount, RequestUser } from '../common/types/request-context';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

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

  // --- Gestion réservée au compte actif (OWNER/ADMIN) ---

  @Get()
  @UseGuards(JwtAuthGuard, AccountGuard, AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN)
  list(@CurrentAccount() account: RequestAccount) {
    return this.invitations.list(account);
  }

  /**
   * Import d'équipe : invitations en masse (le CSV est lu côté client,
   * l'API reçoit une liste déjà structurée). Chaque ligne est traitée
   * indépendamment : une adresse invalide n'annule pas les autres.
   */
  @Post('lot')
  @UseGuards(JwtAuthGuard, AccountGuard, AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN)
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
  @UseGuards(JwtAuthGuard, AccountGuard, AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN)
  create(
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.invitations.create(account, user, dto);
  }

  @Post(':id/resend')
  @UseGuards(JwtAuthGuard, AccountGuard, AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN)
  resend(@CurrentAccount() account: RequestAccount, @Param('id') id: string) {
    return this.invitations.resend(account, id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AccountGuard, AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN)
  revoke(@CurrentAccount() account: RequestAccount, @Param('id') id: string) {
    return this.invitations.revoke(account, id);
  }
}
