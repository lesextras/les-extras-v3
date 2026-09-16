import { Body, Controller, Delete, Get, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { DisponibilitesService } from './disponibilites.service';
import { DeclarerDisponibiliteDto, FiltresVivierDto } from './dto/disponibilite.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestAccount, RequestUser } from '../common/types/request-context';

@Controller('disponibilites')
@UseGuards(JwtAuthGuard, AccountGuard)
export class DisponibilitesController {
  constructor(private readonly disponibilites: DisponibilitesService) {}

  @Get('moi')
  moi(@CurrentAccount() account: RequestAccount) {
    return this.disponibilites.moi(account);
  }

  @Patch('moi')
  declarer(@CurrentAccount() account: RequestAccount, @Body() dto: DeclarerDisponibiliteDto) {
    return this.disponibilites.declarer(account, dto);
  }

  @Post('moi/confirmer')
  confirmer(@CurrentAccount() account: RequestAccount) {
    return this.disponibilites.confirmer(account);
  }

  @Delete('moi')
  retirer(@CurrentAccount() account: RequestAccount) {
    return this.disponibilites.retirer(account);
  }

  @Get('vivier')
  vivier(
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Query() filtres: FiltresVivierDto,
  ) {
    return this.disponibilites.vivier(account, user, filtres);
  }
}
