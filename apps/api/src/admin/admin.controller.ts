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

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  stats() {
    return this.admin.stats();
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

  // --- Factures -----------------------------------------------------------

  @Get('invoices')
  listInvoices(@Query('status') status?: string) {
    return this.admin.listInvoices({ status });
  }

  @Patch('invoices/:id/status')
  updateInvoiceStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.admin.updateInvoiceStatus(id, status);
  }
}
