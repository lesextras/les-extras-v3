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

  /**
   * LA COMPTABILITÉ N'EST PAS UNE INFORMATION D'ÉQUIPE.
   *
   * La LECTURE des factures était ouverte à tout membre du compte : un
   * éducateur rattaché à la MECS pouvait lister l'intégralité de la
   * facturation de sa structure. Il ne pouvait rien modifier — ça, c'était
   * bien verrouillé — mais le menu lui cachait déjà l'entrée « Devis &
   * factures » (voir nav.ts, roles OWNER/ADMIN/MANAGER) : l'interface
   * promettait une restriction que le serveur n'appliquait pas. On aligne le
   * serveur sur ce que le site affiche déjà.
   */
  @Get()
  @UseGuards(AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN, AccountRole.MANAGER)
  findAll(@CurrentAccount() account: AccountCtx) {
    return this.invoices.findAllByAccount(account.id);
  }

  /**
   * Déclaré AVANT `:id` : sans cela Nest prendrait « summary » pour un
   * identifiant de facture et la route ne serait jamais atteinte.
   */
  @Get('summary')
  @UseGuards(AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN, AccountRole.MANAGER)
  summary(@CurrentAccount() account: AccountCtx) {
    return this.invoices.summary(account.id);
  }

  @Get(':id')
  @UseGuards(AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN, AccountRole.MANAGER)
  findOne(@Param('id') id: string, @CurrentAccount() account: AccountCtx) {
    return this.invoices.findOne(id, account.id);
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
