import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IdeaStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestAccount, RequestUser } from '../common/types/request-context';
import { CommunityService } from './community.service';

class CreerIdeeDto {
  @IsString() @MinLength(4) @MaxLength(120) title!: string;
  @IsString() @MinLength(10) @MaxLength(2000) content!: string;
}

class ArbitrerIdeeDto {
  @IsEnum(IdeaStatus) status!: IdeaStatus;
  @IsOptional() @IsString() @MaxLength(2000) reply?: string;
}

/** Points de fidélité et boîte à idées — communs à tous les comptes. */
@Controller('community')
@UseGuards(JwtAuthGuard, AccountGuard)
export class CommunityController {
  constructor(private readonly community: CommunityService) {}

  @Get('points')
  points(@CurrentAccount() account: RequestAccount) {
    return this.community.solde(account.id);
  }

  @Get('idees')
  idees(@CurrentUser() user: RequestUser) {
    return this.community.listerIdees(user.id);
  }

  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  @Post('idees')
  creerIdee(
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Body() dto: CreerIdeeDto,
  ) {
    return this.community.creerIdee(account.id, user.id, dto);
  }

  @Post('idees/:id/vote')
  voter(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.community.voter(id, user.id);
  }

  @Patch('idees/:id')
  arbitrer(
    @Param('id') id: string,
    @Body() dto: ArbitrerIdeeDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.community.arbitrer(id, dto, user.role === 'ADMIN');
  }
}
