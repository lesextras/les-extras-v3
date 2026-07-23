import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AccountRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { AccountRolesGuard } from '../common/guards/account-roles.guard';
import { AccountRoles } from '../common/decorators/account-roles.decorator';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { MissionsService } from './missions.service';
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';
import { QueryMissionsDto } from './dto/query-missions.dto';

interface AccountCtx {
  id: string;
  role: AccountRole;
}

@Controller('missions')
@UseGuards(JwtAuthGuard)
export class MissionsController {
  constructor(private readonly missions: MissionsService) {}

  /** Marketplace public (authentifié) : missions publiées + filtres. */
  @Get('marketplace')
  marketplace(@Query() query: QueryMissionsDto) {
    return this.missions.findMarketplace(query);
  }

  /** Missions du compte établissement actif. */
  @Get()
  @UseGuards(AccountGuard)
  findMine(@CurrentAccount() account: AccountCtx) {
    return this.missions.findAllByAccount(account.id);
  }

  @Get(':id')
  @UseGuards(AccountGuard)
  findOne(@Param('id') id: string, @CurrentAccount() account: AccountCtx) {
    return this.missions.findOne(id, account.id);
  }

  @Post()
  @UseGuards(AccountGuard, AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN, AccountRole.MANAGER)
  create(@CurrentAccount() account: AccountCtx, @Body() dto: CreateMissionDto) {
    return this.missions.create(account.id, dto);
  }

  @Patch(':id')
  @UseGuards(AccountGuard, AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN, AccountRole.MANAGER)
  update(
    @Param('id') id: string,
    @CurrentAccount() account: AccountCtx,
    @Body() dto: UpdateMissionDto,
  ) {
    return this.missions.update(id, account.id, dto);
  }

  @Delete(':id')
  @UseGuards(AccountGuard, AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN)
  remove(@Param('id') id: string, @CurrentAccount() account: AccountCtx) {
    return this.missions.remove(id, account.id);
  }

  /** Publier : DRAFT -> PUBLISHED, démarre la cascade (SALARIES). */
  @Post(':id/publish')
  @UseGuards(AccountGuard, AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN, AccountRole.MANAGER)
  publish(@Param('id') id: string, @CurrentAccount() account: AccountCtx) {
    return this.missions.publish(id, account.id);
  }

  /** Élargir la diffusion d'un cran (SALARIES -> RESERVED -> PUBLIC). */
  @Post(':id/broaden')
  @UseGuards(AccountGuard, AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN, AccountRole.MANAGER)
  broaden(@Param('id') id: string, @CurrentAccount() account: AccountCtx) {
    return this.missions.broaden(id, account.id);
  }

  /** Candidater (FREELANCE) : crée un Booking REQUESTED. */
  @Post(':id/candidate')
  @UseGuards(AccountGuard)
  candidate(@Param('id') id: string, @CurrentAccount() account: AccountCtx) {
    return this.missions.candidate(id, account.id, account.type);
  }
}
