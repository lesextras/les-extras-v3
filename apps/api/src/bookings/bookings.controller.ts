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
import { AccountRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { BookingsService } from './bookings.service';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { QueryBookingsDto } from './dto/query-bookings.dto';
import { CreateTimeEntryDto, ReviewTimeEntryDto } from './dto/time-entry.dto';

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

  /** Export CSV des heures validées du compte (pointage) — paie/facturation. */
  @Get('export/heures.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="les-extras_heures-validees.csv"')
  exportHeures(@CurrentAccount() account: AccountCtx) {
    return this.bookings.exportHeuresValidees(account.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentAccount() account: AccountCtx) {
    return this.bookings.findOne(id, account.id);
  }

  /** Contrat de mission (accessible aux deux parties). */
  @Get(':id/contract')
  contract(@Param('id') id: string, @CurrentAccount() account: AccountCtx) {
    return this.bookings.getContract(id, account.id);
  }

  /** Signer le contrat (freelance ou établissement selon le compte actif). */
  @Patch(':id/sign')
  sign(@Param('id') id: string, @CurrentAccount() account: AccountCtx) {
    return this.bookings.signContract(id, account.id);
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

  // ── Pointage (temps travaillé) ─────────────────────────────────────────────
  /** Liste des créneaux + totaux (les deux parties). */
  @Get(':id/time-entries')
  listTimeEntries(@Param('id') id: string, @CurrentAccount() account: AccountCtx) {
    return this.bookings.listTimeEntries(id, account.id);
  }

  /** Le freelance déclare un créneau travaillé. */
  @Post(':id/time-entries')
  addTimeEntry(
    @Param('id') id: string,
    @CurrentAccount() account: AccountCtx,
    @Body() dto: CreateTimeEntryDto,
  ) {
    return this.bookings.addTimeEntry(id, account.id, dto);
  }

  /** L'établissement valide / refuse un créneau. */
  @Patch('time-entries/:entryId')
  reviewTimeEntry(
    @Param('entryId') entryId: string,
    @CurrentAccount() account: AccountCtx,
    @Body() dto: ReviewTimeEntryDto,
    @CurrentUser() actor: { id: string },
  ) {
    return this.bookings.reviewTimeEntry(entryId, account.id, dto.status, actor.id);
  }

  /** Le freelance supprime un créneau non validé. */
  @Delete('time-entries/:entryId')
  removeTimeEntry(@Param('entryId') entryId: string, @CurrentAccount() account: AccountCtx) {
    return this.bookings.removeTimeEntry(entryId, account.id);
  }
}
