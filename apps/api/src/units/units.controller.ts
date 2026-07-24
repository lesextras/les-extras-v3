import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AccountRole } from '@prisma/client';
import { UnitsService } from './units.service';
import { CreateUnitDto, UpdateUnitDto, AssignMemberDto } from './dto/unit.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { AccountRolesGuard } from '../common/guards/account-roles.guard';
import { AccountRoles } from '../common/decorators/account-roles.decorator';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { RequestAccount } from '../common/types/request-context';

/**
 * Unités / services d'un établissement. Agit sur le COMPTE ACTIF (x-account-id).
 * Lecture : tout membre actif. Écriture : OWNER / ADMIN / MANAGER.
 */
@Controller('units')
@UseGuards(JwtAuthGuard, AccountGuard)
export class UnitsController {
  constructor(private readonly units: UnitsService) {}

  @Get()
  list(@CurrentAccount() account: RequestAccount) {
    return this.units.list(account);
  }

  @Post()
  @UseGuards(AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN, AccountRole.MANAGER)
  create(@CurrentAccount() account: RequestAccount, @Body() dto: CreateUnitDto) {
    return this.units.create(account, dto);
  }

  @Post('assign')
  @UseGuards(AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN, AccountRole.MANAGER)
  assign(@CurrentAccount() account: RequestAccount, @Body() dto: AssignMemberDto) {
    return this.units.assignMember(account, dto);
  }

  @Patch(':id')
  @UseGuards(AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN, AccountRole.MANAGER)
  update(
    @CurrentAccount() account: RequestAccount,
    @Param('id') id: string,
    @Body() dto: UpdateUnitDto,
  ) {
    return this.units.update(account, id, dto);
  }

  @Delete(':id')
  @UseGuards(AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN, AccountRole.MANAGER)
  remove(@CurrentAccount() account: RequestAccount, @Param('id') id: string) {
    return this.units.remove(account, id);
  }
}
