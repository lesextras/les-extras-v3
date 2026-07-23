import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestAccount, RequestUser } from '../common/types/request-context';
import { TutoratService } from './tutorat.service';
import {
  CreateEntretienDto,
  CreateJalonDto,
  UpdateJalonDto,
  UpsertTutoratDto,
} from './dto/tutorat.dto';

@Controller('tutorat')
@UseGuards(JwtAuthGuard, AccountGuard)
export class TutoratController {
  constructor(private readonly tutorat: TutoratService) {}

  @Get('inscription/:inscriptionId')
  get(
    @Param('inscriptionId') inscriptionId: string,
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
  ) {
    return this.tutorat.getByInscription(inscriptionId, account.id, user.id);
  }

  @Patch('inscription/:inscriptionId')
  upsert(
    @Param('inscriptionId') inscriptionId: string,
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Body() dto: UpsertTutoratDto,
  ) {
    return this.tutorat.upsert(inscriptionId, account.id, user.id, dto);
  }

  @Post('inscription/:inscriptionId/entretiens')
  addEntretien(
    @Param('inscriptionId') inscriptionId: string,
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateEntretienDto,
  ) {
    return this.tutorat.addEntretien(inscriptionId, account.id, user.id, dto);
  }

  @Post('inscription/:inscriptionId/jalons')
  addJalon(
    @Param('inscriptionId') inscriptionId: string,
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateJalonDto,
  ) {
    return this.tutorat.addJalon(inscriptionId, account.id, user.id, dto);
  }

  @Patch('jalons/:jalonId')
  updateJalon(
    @Param('jalonId') jalonId: string,
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateJalonDto,
  ) {
    return this.tutorat.updateJalon(jalonId, account.id, user.id, dto);
  }
}
