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
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AdjustCreditsDto } from './dto/credits.dto';
import { DevenirIntervenantDto } from './dto/devenir-intervenant.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';
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

  /** Bascule salarié → intervenant : crée le compte et reprend les fiches. */
  @Post('devenir-intervenant')
  devenirIntervenant(
    @CurrentUser() user: RequestUser,
    @Body() dto: DevenirIntervenantDto,
  ) {
    return this.accounts.devenirIntervenant(user.id, dto);
  }

  /**
   * Recherche d'établissements par nom, pour le compte « salarié » qui
   * choisit à qui envoyer sa demande de rattachement. Doit rester avant
   * `@Get(':id')` : sinon "etablissements" serait lu comme un id de compte.
   */
  @Get('etablissements/recherche')
  searchEtablissements(@Query('q') q?: string) {
    return this.accounts.searchEstablishments(q ?? '');
  }

  /** Fiches d'un compte que l'utilisateur peut reprendre à son compte propre. */
  @Get(':id/fiches-importables')
  fichesImportables(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.accounts.fichesImportables(user.id, id);
  }

  @Post(':id/switch')
  switchAccount(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.accounts.switchAccount(user.id, id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.accounts.findOne(user.id, id);
  }

  /** Solde de crédits + grand livre récent — réservé aux membres du compte. */
  @Get(':id/credit-ledger')
  creditLedger(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.accounts.creditLedger(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accounts.update(user.id, id, dto);
  }

  /**
   * Ajout/retrait de crédits — réservé à l'administration plateforme.
   * Empêche un établissement de s'auto-créditer sans paiement.
   */
  @Patch(':id/credits')
  @UseGuards(AdminGuard)
  adjustCredits(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: AdjustCreditsDto,
  ) {
    return this.accounts.adjustCredits(user.id, id, dto.delta, true);
  }

  @Delete(':id')
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.accounts.remove(user.id, id);
  }
}
