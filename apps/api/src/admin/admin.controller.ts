import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { AdminService } from './admin.service';
import { QueryUsersDto } from './dto/query-users.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { ModerateMissionDto, ModerateServiceDto } from './dto/moderate.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  stats() {
    return this.admin.stats();
  }

  @Get('users')
  listUsers(@Query() query: QueryUsersDto) {
    return this.admin.listUsers(query);
  }

  @Patch('users/:id/ban')
  banUser(@Param('id') id: string, @Body() dto: BanUserDto) {
    return this.admin.banUser(id, dto);
  }

  @Patch('users/:id/unban')
  unbanUser(@Param('id') id: string) {
    return this.admin.unbanUser(id);
  }

  @Get('missions')
  listMissions() {
    return this.admin.listMissions();
  }

  @Patch('missions/:id/moderate')
  moderateMission(@Param('id') id: string, @Body() dto: ModerateMissionDto) {
    return this.admin.moderateMission(id, dto);
  }

  @Get('services')
  listServices() {
    return this.admin.listServices();
  }

  @Patch('services/:id/moderate')
  moderateService(@Param('id') id: string, @Body() dto: ModerateServiceDto) {
    return this.admin.moderateService(id, dto);
  }
}
