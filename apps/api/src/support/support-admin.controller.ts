import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { SupportStatut } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';
import { SupportService } from './support.service';
import { RepondreTicketDto, SuivreTicketDto } from './dto/support.dto';

/** La boîte de réception de l'association. */
@Controller('admin/assistance')
@UseGuards(JwtAuthGuard, AdminGuard)
export class SupportAdminController {
  constructor(private readonly support: SupportService) {}

  @Get()
  lister(@Query('statut') statut?: string) {
    const valide =
      statut && (Object.values(SupportStatut) as string[]).includes(statut)
        ? (statut as SupportStatut)
        : undefined;
    return this.support.listerPourEquipe(valide);
  }

  @Get('a-traiter')
  aTraiter() {
    return this.support.aTraiter();
  }

  @Get(':id')
  lire(@Param('id') id: string) {
    return this.support.lirePourEquipe(id);
  }

  @Post(':id/messages')
  repondre(@Param('id') id: string, @Body() dto: RepondreTicketDto) {
    return this.support.repondreEquipe(id, dto);
  }

  @Patch(':id')
  suivre(@Param('id') id: string, @Body() dto: SuivreTicketDto) {
    return this.support.suivre(id, dto);
  }
}
