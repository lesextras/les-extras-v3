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
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AdjustCreditsDto } from './dto/credits.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/types/request-context';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  /** Comptes de l'utilisateur courant. */
  @Get()
  findMine(@CurrentUser() user: RequestUser) {
    return this.accounts.findMine(user.id);
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateAccountDto) {
    return this.accounts.create(user.id, dto);
  }

  @Post(':id/switch')
  switchAccount(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.accounts.switchAccount(user.id, id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.accounts.findOne(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accounts.update(user.id, id, dto);
  }

  @Patch(':id/credits')
  adjustCredits(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: AdjustCreditsDto,
  ) {
    return this.accounts.adjustCredits(user.id, id, dto.delta);
  }

  @Delete(':id')
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.accounts.remove(user.id, id);
  }
}
