import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto, RejectQuoteDto } from './dto/quotes.dto';

interface AuthRequest extends Request {
  user: { id: string; role: string };
}

@Controller('quotes')
@UseGuards(JwtAuthGuard)
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  async generate(@Req() req: AuthRequest, @Body() dto: CreateQuoteDto) {
    return this.quotesService.generateQuote(req.user.id, dto);
  }

  @Patch(':id/accept')
  async accept(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.quotesService.acceptQuote(id, req.user.id);
  }

  @Patch(':id/reject')
  async reject(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: RejectQuoteDto,
  ) {
    return this.quotesService.rejectQuote(id, req.user.id, dto);
  }

  @Get('booking/:bookingId')
  async getByBooking(
    @Req() req: AuthRequest,
    @Param('bookingId') bookingId: string,
  ) {
    return this.quotesService.getQuotesByBooking(bookingId, req.user.id);
  }

  @Get('booking/:bookingId/prefill')
  async getPrefill(
    @Req() req: AuthRequest,
    @Param('bookingId') bookingId: string,
  ) {
    return this.quotesService.getQuotePrefill(bookingId, req.user.id);
  }

  @Get(':id/pdf')
  async downloadPdf(
    @Req() req: AuthRequest,
    @Res() res: Response,
    @Param('id') id: string,
  ) {
    const buffer = await this.quotesService.generateQuotePdf(id, req.user as any);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="devis-${id.substring(0, 8)}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
