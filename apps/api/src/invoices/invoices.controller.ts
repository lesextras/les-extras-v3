import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AccountRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { AccountRolesGuard } from '../common/guards/account-roles.guard';
import { AccountRoles } from '../common/decorators/account-roles.decorator';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

interface AccountCtx {
  id: string;
  role: AccountRole;
}

@Controller('invoices')
@UseGuards(JwtAuthGuard, AccountGuard)
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get()
  findAll(@CurrentAccount() account: AccountCtx) {
    return this.invoices.findAllByAccount(account.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentAccount() account: AccountCtx) {
    return this.invoices.findOne(id, account.id);
  }

  @Get(':id/pdf')
  getPdf(@Param('id') id: string, @CurrentAccount() account: AccountCtx) {
    return this.invoices.getPdf(id, account.id);
  }

  @Post()
  @UseGuards(AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN, AccountRole.MANAGER)
  create(@CurrentAccount() account: AccountCtx, @Body() dto: CreateInvoiceDto) {
    return this.invoices.create(account.id, dto);
  }

  @Patch(':id/issue')
  @UseGuards(AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN, AccountRole.MANAGER)
  issue(@Param('id') id: string, @CurrentAccount() account: AccountCtx) {
    return this.invoices.issue(id, account.id);
  }

  @Patch(':id/pay')
  @UseGuards(AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN, AccountRole.MANAGER)
  pay(@Param('id') id: string, @CurrentAccount() account: AccountCtx) {
    return this.invoices.markPaid(id, account.id);
  }

  @Patch(':id/cancel')
  @UseGuards(AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN)
  cancel(@Param('id') id: string, @CurrentAccount() account: AccountCtx) {
    return this.invoices.cancel(id, account.id);
  }
}
