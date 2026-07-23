import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestAccount, RequestUser } from '../common/types/request-context';
import { MatchingService } from './matching.service';

@Controller('matching')
@UseGuards(JwtAuthGuard, AccountGuard)
export class MatchingController {
  constructor(private readonly matching: MatchingService) {}

  /** Établissement : freelances classés par pertinence pour une mission. */
  @Get('missions/:id/candidates')
  candidates(@CurrentAccount() account: RequestAccount, @Param('id') id: string) {
    return this.matching.candidatesForMission(id, account.id);
  }

  /** Freelance : missions classées par pertinence pour lui. */
  @Get('opportunities')
  opportunities(@CurrentUser() user: RequestUser) {
    return this.matching.opportunitiesForFreelance(user.id);
  }
}
