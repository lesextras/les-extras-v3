import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';
import { QualiopiService } from './qualiopi.service';
import { UpsertProofDto } from './dto/upsert-proof.dto';

/** Conformité Qualiopi — réservé à l'OF (ADMIN). */
@Controller('admin/qualiopi')
@UseGuards(JwtAuthGuard, AdminGuard)
export class QualiopiController {
  constructor(private readonly qualiopi: QualiopiService) {}

  @Get()
  conformite() {
    return this.qualiopi.conformite();
  }

  @Patch('indicators/:indicatorId/proof')
  upsertProof(@Param('indicatorId') indicatorId: string, @Body() dto: UpsertProofDto) {
    return this.qualiopi.upsertProof(indicatorId, dto);
  }
}
