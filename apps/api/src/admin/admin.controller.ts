import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { AdminService } from './admin.service';
import { QueryUsersDto } from './dto/query-users.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { ModerateMissionDto, ModerateServiceDto } from './dto/moderate.dto';
import { UpdateAccountDto } from './dto/account-admin.dto';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category-admin.dto';
import { CreateArticleDto, UpdateArticleDto } from './dto/article-admin.dto';
import { CreateUserDto, UpdateUserDto } from './dto/user-admin.dto';
import {
  CreateFormationAdminDto,
  UpdateFormationAdminDto,
  CreateSessionAdminDto,
} from './dto/formation-admin.dto';
import { UpdateBookingStatusDto } from './dto/booking-admin.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  stats() {
    return this.admin.stats();
  }

  @Get('stats/roi')
  roiStats() {
    return this.admin.roiStats();
  }

  // --- Coffre-fort de conformité (vue plateforme) -------------------------

  @Get('conformite')
  conformite() {
    return this.admin.conformiteOverview();
  }

  // --- Utilisateurs -------------------------------------------------------

  @Get('users')
  listUsers(@Query() query: QueryUsersDto) {
    return this.admin.listUsers(query);
  }

  @Post('users')
  createUser(@Body() dto: CreateUserDto) {
    return this.admin.createUser(dto);
  }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.admin.updateUser(id, dto);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.admin.deleteUser(id);
  }

  @Patch('users/:id/ban')
  banUser(@Param('id') id: string, @Body() dto: BanUserDto) {
    return this.admin.banUser(id, dto);
  }

  @Patch('users/:id/unban')
  unbanUser(@Param('id') id: string) {
    return this.admin.unbanUser(id);
  }

  // --- Missions -----------------------------------------------------------

  @Get('missions')
  listMissions() {
    return this.admin.listMissions();
  }

  /** Détail d'une mission (aperçu modération, tout statut). */
  @Get('missions/:id')
  getMission(@Param('id') id: string) {
    return this.admin.getMission(id);
  }

  @Patch('missions/:id/moderate')
  moderateMission(@Param('id') id: string, @Body() dto: ModerateMissionDto) {
    return this.admin.moderateMission(id, dto);
  }

  @Delete('missions/:id')
  deleteMission(@Param('id') id: string) {
    return this.admin.deleteMission(id);
  }

  // --- Services / Ateliers ------------------------------------------------

  @Get('services')
  listServices() {
    return this.admin.listServices();
  }

  /** Détail d'un atelier (aperçu modération, tout statut). */
  @Get('services/:id')
  getService(@Param('id') id: string) {
    return this.admin.getService(id);
  }

  @Patch('services/:id/moderate')
  moderateService(@Param('id') id: string, @Body() dto: ModerateServiceDto) {
    return this.admin.moderateService(id, dto);
  }

  @Delete('services/:id')
  deleteService(@Param('id') id: string) {
    return this.admin.deleteService(id);
  }

  // --- Comptes / Organisations -------------------------------------------

  @Get('accounts')
  listAccounts(@Query('type') type?: string, @Query('search') search?: string) {
    return this.admin.listAccounts({ type, search });
  }

  @Get('accounts/:id')
  getAccount(@Param('id') id: string) {
    return this.admin.getAccount(id);
  }

  @Patch('accounts/:id')
  updateAccount(@Param('id') id: string, @Body() dto: UpdateAccountDto) {
    return this.admin.updateAccount(id, dto);
  }

  @Delete('accounts/:id')
  deleteAccount(@Param('id') id: string) {
    return this.admin.deleteAccount(id);
  }

  // --- Catégories ---------------------------------------------------------

  @Get('categories')
  listCategories() {
    return this.admin.listCategories();
  }

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.admin.createCategory(dto);
  }

  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.admin.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  removeCategory(@Param('id') id: string) {
    return this.admin.removeCategory(id);
  }

  // --- Articles -----------------------------------------------------------

  @Get('articles')
  listArticles() {
    return this.admin.listArticles();
  }

  @Post('articles')
  createArticle(@Body() dto: CreateArticleDto) {
    return this.admin.createArticle(dto);
  }

  @Patch('articles/:id')
  updateArticle(@Param('id') id: string, @Body() dto: UpdateArticleDto) {
    return this.admin.updateArticle(id, dto);
  }

  @Delete('articles/:id')
  removeArticle(@Param('id') id: string) {
    return this.admin.removeArticle(id);
  }

  // --- Réservations -------------------------------------------------------

  @Get('bookings')
  listBookings(@Query('status') status?: string) {
    return this.admin.listBookings({ status });
  }

  @Patch('bookings/:id/status')
  updateBookingStatus(@Param('id') id: string, @Body() dto: UpdateBookingStatusDto) {
    return this.admin.updateBookingStatus(id, dto.status);
  }

  // --- Factures -----------------------------------------------------------

  @Get('invoices')
  listInvoices(@Query('status') status?: string) {
    return this.admin.listInvoices({ status });
  }

  @Get('invoices/:id')
  getInvoice(@Param('id') id: string) {
    return this.admin.getInvoice(id);
  }

  @Patch('invoices/:id/status')
  updateInvoiceStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.admin.updateInvoiceStatus(id, status);
  }

  // --- Invitations --------------------------------------------------------

  @Get('invitations')
  listInvitations(@Query('status') status?: string) {
    return this.admin.listInvitations(status);
  }

  @Patch('invitations/:id/revoke')
  revokeInvitation(@Param('id') id: string) {
    return this.admin.revokeInvitation(id);
  }

  @Patch('invitations/:id/resend')
  resendInvitation(@Param('id') id: string) {
    return this.admin.resendInvitation(id);
  }

  // --- Centre de formation ------------------------------------------------

  @Get('formations')
  listFormations(@Query('type') type?: string, @Query('status') status?: string) {
    return this.admin.listFormations({ type, status });
  }

  @Get('formations/sessions')
  listFormationSessions(@Query('status') status?: string) {
    return this.admin.listSessions({ status });
  }

  // --- Registre & BPF (Bilan Pédagogique et Financier) --------------------

  @Get('formations/registre')
  registre() {
    return this.admin.registre();
  }

  @Get('formations/bpf')
  bpf(@Query('year') year?: string) {
    return this.admin.bpf(year ? Number(year) : undefined);
  }

  @Get('formations/bpf.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="bpf.csv"')
  bpfCsv(@Query('year') year?: string) {
    return this.admin.bpfCsv(year ? Number(year) : undefined);
  }

  @Post('formations')
  createFormation(@Body() dto: CreateFormationAdminDto) {
    return this.admin.createFormation(dto);
  }

  @Get('formations/:id')
  getFormation(@Param('id') id: string) {
    return this.admin.getFormation(id);
  }

  @Patch('formations/:id')
  updateFormation(@Param('id') id: string, @Body() dto: UpdateFormationAdminDto) {
    return this.admin.updateFormation(id, dto);
  }

  @Delete('formations/:id')
  deleteFormation(@Param('id') id: string) {
    return this.admin.deleteFormation(id);
  }

  @Post('formations/:id/sessions')
  createFormationSession(@Param('id') id: string, @Body() dto: CreateSessionAdminDto) {
    return this.admin.createFormationSession(id, dto);
  }

  // ── Demandes de contact (formulaire public) ──────────────────────────────
  @Get('contacts')
  listContacts(@Query('status') status?: string) {
    return this.admin.listContacts(status);
  }

  @Patch('contacts/:id')
  setContactStatus(@Param('id') id: string, @Body() body: { status?: string }) {
    return this.admin.setContactStatus(id, body?.status);
  }

  // ── Journal d'audit (traçabilité) ────────────────────────────────────────

  /**
   * Journal d'audit paginé, du plus récent au plus ancien.
   * Filtres optionnels : action, type/identifiant d'entité, auteur, période.
   * Ex. GET /admin/audit?action=booking.time_entry.validated&from=2026-01-01&page=2
   */
  @Get('audit')
  listAudit(
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('actorId') actorId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.admin.listAudit({
      action,
      entityType,
      entityId,
      actorId,
      from,
      to,
      page: page ? Number(page) : undefined,
      perPage: perPage ? Number(perPage) : undefined,
    });
  }
}
