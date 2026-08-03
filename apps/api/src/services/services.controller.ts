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
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServicesDto } from './dto/query-services.dto';
import { BookServiceDto } from './dto/book-service.dto';

interface AccountCtx {
  id: string;
  role: AccountRole;
}

@Controller('services')
@UseGuards(JwtAuthGuard)
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  /** Catalogue public (authentifié) des ateliers publiés. */
  @Get('catalog')
  catalog(@Query() query: QueryServicesDto) {
    return this.services.findCatalog(query);
  }

  @Get()
  @UseGuards(AccountGuard)
  findMine(@CurrentAccount() account: AccountCtx, @Query('take') take?: string) {
    return this.services.findAllByAccount(account.id, take ? Number(take) : undefined);
  }

  @Get(':id')
  @UseGuards(AccountGuard)
  findOne(@Param('id') id: string, @CurrentAccount() account: AccountCtx) {
    return this.services.findOne(id, account.id);
  }

  @Post()
  @UseGuards(AccountGuard, AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN, AccountRole.MANAGER)
  create(@CurrentAccount() account: AccountCtx, @Body() dto: CreateServiceDto) {
    return this.services.create(account.id, dto);
  }

  @Patch(':id')
  @UseGuards(AccountGuard, AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN, AccountRole.MANAGER)
  update(
    @Param('id') id: string,
    @CurrentAccount() account: AccountCtx,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.services.update(id, account.id, dto);
  }

  @Delete(':id')
  @UseGuards(AccountGuard, AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN)
  remove(@Param('id') id: string, @CurrentAccount() account: AccountCtx) {
    return this.services.remove(id, account.id);
  }

  /** Réserver un atelier : crée un Booking REQUESTED. */
  @Post(':id/book')
  @UseGuards(AccountGuard)
  book(
    @Param('id') id: string,
    @CurrentAccount() account: AccountCtx,
    @Body() dto: BookServiceDto,
  ) {
    return this.services.book(id, account.id, dto);
  }
}
