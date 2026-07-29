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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestAccount, RequestUser } from '../common/types/request-context';
import { FormationsService } from './formations.service';
import { CreateFormationDto } from './dto/create-formation.dto';
import { UpdateFormationDto } from './dto/update-formation.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { CreateInscriptionDto } from './dto/create-inscription.dto';
import { UpdateInscriptionDto } from './dto/update-inscription.dto';
import { SignEmargementDto } from './dto/sign-emargement.dto';
import { QueryFormationsDto } from './dto/query-formations.dto';

const MANAGER_ROLES = [AccountRole.OWNER, AccountRole.ADMIN, AccountRole.MANAGER];

@Controller('formations')
@UseGuards(JwtAuthGuard)
export class FormationsController {
  constructor(private readonly formations: FormationsService) {}

  /** Catalogue (authentifié) des programmes publiés. */
  @Get('catalog')
  catalog(@Query() query: QueryFormationsDto) {
    return this.formations.findCatalog(query);
  }

  /** Membres mobilisables comme formateurs internes (parcours B). */
  @Get('internal-trainers')
  @UseGuards(AccountGuard)
  internalTrainers(@CurrentAccount() account: RequestAccount) {
    return this.formations.internalTrainers(account.id);
  }

  /** Programmes gérés par le compte actif. */
  @Get()
  @UseGuards(AccountGuard)
  findMine(@CurrentAccount() account: RequestAccount) {
    return this.formations.findMine(account.id);
  }

  @Post()
  @UseGuards(AccountGuard, AccountRolesGuard)
  @AccountRoles(...MANAGER_ROLES)
  create(@CurrentAccount() account: RequestAccount, @Body() dto: CreateFormationDto) {
    return this.formations.create(account.id, dto);
  }

  /**
   * Les formations auxquelles la structure a inscrit ses salariés. Déclaré
   * AVANT `:id`, sinon Nest interpréterait « mes-inscriptions » comme un
   * identifiant de formation.
   */
  @Get('mes-inscriptions')
  @UseGuards(AccountGuard)
  mesInscriptions(@CurrentAccount() account: RequestAccount) {
    return this.formations.mesInscriptions(account.id);
  }

  // --- Sessions (préfixe à 2+ segments, déclaré avant :id) ----------------

  @Get('sessions/:sessionId')
  @UseGuards(AccountGuard)
  getSession(
    @Param('sessionId') sessionId: string,
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
  ) {
    return this.formations.getSession(sessionId, account.id, user.id);
  }

  @Patch('sessions/:sessionId')
  @UseGuards(AccountGuard)
  updateSession(
    @Param('sessionId') sessionId: string,
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateSessionDto,
  ) {
    return this.formations.updateSession(sessionId, account.id, user.id, dto);
  }

  @Post('sessions/:sessionId/inscriptions')
  @UseGuards(AccountGuard)
  enroll(
    @Param('sessionId') sessionId: string,
    @CurrentAccount() account: RequestAccount,
    @Body() dto: CreateInscriptionDto,
  ) {
    return this.formations.enroll(sessionId, account.id, dto);
  }

  @Get('inscriptions/:inscriptionId')
  @UseGuards(AccountGuard)
  getInscription(
    @Param('inscriptionId') inscriptionId: string,
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
  ) {
    return this.formations.getInscription(inscriptionId, account.id, user.id);
  }

  @Post('inscriptions/:inscriptionId/invoice')
  @UseGuards(AccountGuard)
  invoiceInscription(
    @Param('inscriptionId') inscriptionId: string,
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Body('amount') amount?: number,
  ) {
    return this.formations.invoiceInscription(inscriptionId, account.id, user.id, amount);
  }

  @Patch('inscriptions/:inscriptionId')
  @UseGuards(AccountGuard)
  updateInscription(
    @Param('inscriptionId') inscriptionId: string,
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateInscriptionDto,
  ) {
    return this.formations.updateInscription(inscriptionId, account.id, user.id, dto);
  }

  @Post('inscriptions/:inscriptionId/emargement')
  @UseGuards(AccountGuard)
  signEmargement(
    @Param('inscriptionId') inscriptionId: string,
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Body() dto: SignEmargementDto,
  ) {
    return this.formations.signEmargement(inscriptionId, account.id, user.id, dto);
  }

  // --- Programme par id (déclaré après les préfixes statiques) ------------

  @Get(':id')
  @UseGuards(AccountGuard)
  findOne(@Param('id') id: string, @CurrentAccount() account: RequestAccount) {
    return this.formations.findOne(id, account.id);
  }

  @Patch(':id')
  @UseGuards(AccountGuard, AccountRolesGuard)
  @AccountRoles(...MANAGER_ROLES)
  update(
    @Param('id') id: string,
    @CurrentAccount() account: RequestAccount,
    @Body() dto: UpdateFormationDto,
  ) {
    return this.formations.update(id, account.id, dto);
  }

  @Delete(':id')
  @UseGuards(AccountGuard, AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN)
  remove(@Param('id') id: string, @CurrentAccount() account: RequestAccount) {
    return this.formations.remove(id, account.id);
  }

  @Post(':id/sessions')
  @UseGuards(AccountGuard, AccountRolesGuard)
  @AccountRoles(...MANAGER_ROLES)
  createSession(
    @Param('id') id: string,
    @CurrentAccount() account: RequestAccount,
    @Body() dto: CreateSessionDto,
  ) {
    return this.formations.createSession(id, account.id, dto);
  }
}
