import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AccountRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { BookingsService } from './bookings.service';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { QueryBookingsDto } from './dto/query-bookings.dto';

interface AccountCtx {
  id: string;
  role: AccountRole;
}

@Controller('bookings')
@UseGuards(JwtAuthGuard, AccountGuard)
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Get()
  findAll(@CurrentAccount() account: AccountCtx, @Query() query: QueryBookingsDto) {
    return this.bookings.findAllByAccount(account.id, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentAccount() account: AccountCtx) {
    return this.bookings.findOne(id, account.id);
  }

  @Patch(':id/accept')
  accept(@Param('id') id: string, @CurrentAccount() account: AccountCtx) {
    return this.bookings.accept(id, account.id);
  }

  @Patch(':id/confirm')
  confirm(@Param('id') id: string, @CurrentAccount() account: AccountCtx) {
    return this.bookings.confirm(id, account.id);
  }

  @Patch(':id/start')
  start(@Param('id') id: string, @CurrentAccount() account: AccountCtx) {
    return this.bookings.start(id, account.id);
  }

  @Patch(':id/complete')
  complete(@Param('id') id: string, @CurrentAccount() account: AccountCtx) {
    return this.bookings.complete(id, account.id);
  }

  @Patch(':id/cancel')
  cancel(
    @Param('id') id: string,
    @CurrentAccount() account: AccountCtx,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookings.cancel(id, account.id, dto);
  }
}
