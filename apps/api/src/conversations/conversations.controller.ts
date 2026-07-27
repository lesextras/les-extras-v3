import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { SendMessageDto } from './dto/conversations.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/jwt-payload.type';

@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  async findAll(@Request() req: { user: AuthenticatedUser }) {
    return this.conversationsService.findAllForUser(req.user.id);
  }

  @Get(':id/messages')
  async findMessages(@Param('id') id: string, @Request() req: { user: AuthenticatedUser }) {
    return this.conversationsService.findMessages(id, req.user.id);
  }

  @Post('messages')
  async sendMessage(@Body() dto: SendMessageDto, @Request() req: { user: AuthenticatedUser }) {
    if (dto.receiverId === req.user.id) {
      throw new ForbiddenException('You cannot send a message to yourself');
    }
    return this.conversationsService.sendMessage(req.user.id, dto);
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req: { user: AuthenticatedUser }) {
    return this.conversationsService.markAsRead(id, req.user.id);
  }
}
