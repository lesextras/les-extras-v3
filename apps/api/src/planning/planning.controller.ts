import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestAccount, RequestUser } from '../common/types/request-context';
import { PlanningService } from './planning.service';
import { AvailabilityDto, CreateShiftDto, SetStatusDto, UpdateShiftDto } from './dto/shift.dto';

@Controller()
@UseGuards(JwtAuthGuard, AccountGuard)
export class PlanningController {
  constructor(private readonly planning: PlanningService) {}

  @Get('planning')
  planningRange(@CurrentAccount() a: RequestAccount, @CurrentUser() u: RequestUser,
    @Query('from') from?: string, @Query('to') to?: string,
    @Query('orgUnitId') orgUnitId?: string) {
    return this.planning.getPlanning(a.id, a.type, u.id, from, to, orgUnitId);
  }

  @Post('shifts')
  create(@CurrentAccount() a: RequestAccount, @Body() dto: CreateShiftDto) {
    return this.planning.createShift(a.id, dto);
  }

  @Patch('shifts/:id')
  update(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: UpdateShiftDto) {
    return this.planning.updateShift(a.id, id, dto);
  }

  @Patch('shifts/:id/status')
  status(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: SetStatusDto) {
    return this.planning.setStatus(a.id, id, dto.status);
  }

  @Delete('shifts/:id')
  remove(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.planning.deleteShift(a.id, id);
  }

  @Post('shifts/from-booking/:bookingId')
  fromBooking(@CurrentAccount() a: RequestAccount, @Param('bookingId') bookingId: string) {
    return this.planning.shiftFromBooking(a.id, bookingId);
  }

  @Get('availability')
  listAvail(@CurrentUser() u: RequestUser) {
    return this.planning.listAvailability(u.id);
  }

  @Post('availability')
  addAvail(@CurrentUser() u: RequestUser, @Body() dto: AvailabilityDto) {
    return this.planning.addAvailability(u.id, dto);
  }

  @Delete('availability/:id')
  removeAvail(@CurrentUser() u: RequestUser, @Param('id') id: string) {
    return this.planning.removeAvailability(u.id, id);
  }
}
