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
