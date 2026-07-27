import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AccountRole, MembershipStatus } from '@prisma/client';
import { MembershipsService } from './memberships.service';
import { UpdateMembershipRoleDto } from './dto/update-membership-role.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AccountGuard } from '../common/guards/account.guard';
import { AccountRolesGuard } from '../common/guards/account-roles.guard';
import { AccountRoles } from '../common/decorators/account-roles.decorator';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { RequestAccount, RequestUser } from '../common/types/request-context';

/**
 * Toutes les routes agissent sur le COMPTE ACTIF (header x-account-id),
 * résolu par AccountGuard. La gestion est réservée OWNER/ADMIN.
 */
@Controller('memberships')
@UseGuards(JwtAuthGuard, AccountGuard)
export class MembershipsController {
  constructor(private readonly memberships: MembershipsService) {}

  /** Lister les membres : accessible à tout membre actif du compte. */
  @Get()
  list(@CurrentAccount() account: RequestAccount) {
    return this.memberships.list(account);
  }

  @Patch(':id/role')
  @UseGuards(AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN)
  changeRole(
    @CurrentAccount() account: RequestAccount,
    @Param('id') id: string,
    @Body() dto: UpdateMembershipRoleDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.memberships.changeRole(account, id, dto.role, actor.id);
  }

  @Patch(':id/suspend')
  @UseGuards(AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN)
  suspend(@CurrentAccount() account: RequestAccount, @Param('id') id: string) {
    return this.memberships.setStatus(account, id, MembershipStatus.SUSPENDED);
  }

  @Patch(':id/reactivate')
  @UseGuards(AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN)
  reactivate(@CurrentAccount() account: RequestAccount, @Param('id') id: string) {
    return this.memberships.setStatus(account, id, MembershipStatus.ACTIVE);
  }

  @Delete(':id')
  @UseGuards(AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN)
  remove(@CurrentAccount() account: RequestAccount, @Param('id') id: string) {
    return this.memberships.remove(account, id);
  }
}
