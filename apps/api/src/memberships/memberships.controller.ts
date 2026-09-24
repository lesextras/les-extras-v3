import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
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
 * résolu par AccountGuard.
 *
 * La GESTION (rôle, suspension, retrait) ne concerne que les espaces Piloter
 * (association, académie), et y est réservée OWNER/ADMIN : sur Les Extras,
 * « 1 compte = 1 personne » depuis le 24/09/2026, il n'y a plus d'équipe à
 * gérer. Le refus est posé dans le service (`assertGestionPiloter`), parce que
 * `AccountRolesGuard` laisse tout passer sur un compte Les Extras.
 */
@Controller('memberships')
@UseGuards(JwtAuthGuard, AccountGuard)
export class MembershipsController {
  constructor(private readonly memberships: MembershipsService) {}

  /**
   * Lister les membres : accessible à tout membre actif du compte.
   * Paginé et filtrable — voir le service pour le pourquoi.
   */
  @Get()
  list(
    @CurrentAccount() account: RequestAccount,
    @Query('q') q?: string,
    @Query('role') role?: AccountRole,
    @Query('status') status?: MembershipStatus,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.memberships.list(account, {
      q,
      role,
      status,
      page: page ? Number(page) : undefined,
      perPage: perPage ? Number(perPage) : undefined,
    });
  }

  /** Une personne précise, pour sa fiche. */
  @Get('personne/:userId')
  personne(@CurrentAccount() account: RequestAccount, @Param('userId') userId: string) {
    return this.memberships.parUtilisateur(account, userId);
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
