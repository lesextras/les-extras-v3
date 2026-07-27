import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/jwt-payload.type';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
    constructor(private readonly invoicesService: InvoicesService) { }

    @Get()
    async findAll(@CurrentUser() user: AuthenticatedUser) {
        return this.invoicesService.findAll(user);
    }

    @Get(':id/download')
    async downloadInvoice(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id') id: string,
        @Res() res: Response,
    ) {
        const pdfBuffer = await this.invoicesService.generateInvoicePdf(id, user);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=invoice-${id}.pdf`,
            'Content-Length': pdfBuffer.length,
        });

        res.end(pdfBuffer);
    }
}
