import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AccountRole } from '@prisma/client';
import { AttachmentRequestsService } from './attachment-requests.service';
import { CreateAttachmentRequestDto } from './dto/create-attachment-request.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { AccountRolesGuard } from '../common/guards/account-roles.guard';
import { AccountRoles } from '../common/decorators/account-roles.decorator';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestAccount, RequestUser } from '../common/types/request-context';

@Controller('attachment-requests')
export class AttachmentRequestsController {
  constructor(private readonly attachmentRequests: AttachmentRequestsService) {}

  // --- Côté compte « salarié » (self-service, sur son propre compte actif) ---

  @Post()
  @UseGuards(JwtAuthGuard, AccountGuard)
  create(
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateAttachmentRequestDto,
  ) {
    return this.attachmentRequests.create(account, user, dto);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard, AccountGuard)
  listMine(@CurrentAccount() account: RequestAccount) {
    return this.attachmentRequests.listMine(account);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AccountGuard)
  cancel(@CurrentAccount() account: RequestAccount, @Param('id') id: string) {
    return this.attachmentRequests.cancel(account, id);
  }

  // --- Côté établissement (OWNER/ADMIN sur le compte actif) ---

  @Get()
  @UseGuards(JwtAuthGuard, AccountGuard, AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN)
  list(@CurrentAccount() account: RequestAccount) {
    return this.attachmentRequests.listForEstablishment(account);
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, AccountGuard, AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN)
  approve(@CurrentAccount() account: RequestAccount, @CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.attachmentRequests.approve(account, user, id);
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, AccountGuard, AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN)
  reject(@CurrentAccount() account: RequestAccount, @CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.attachmentRequests.reject(account, user, id);
  }
}
