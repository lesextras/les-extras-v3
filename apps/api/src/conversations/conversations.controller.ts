import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

interface UserCtx {
  id: string;
  role: string;
}

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Get()
  findAll(@CurrentUser() user: UserCtx) {
    return this.conversations.findAll(user.id);
  }

  @Post()
  create(@CurrentUser() user: UserCtx, @Body() dto: CreateConversationDto) {
    return this.conversations.create(user.id, dto);
  }

  @Get(':id/messages')
  getMessages(@Param('id') id: string, @CurrentUser() user: UserCtx) {
    return this.conversations.getMessages(id, user.id);
  }

  @Post(':id/messages')
  sendMessage(
    @Param('id') id: string,
    @CurrentUser() user: UserCtx,
    @Body() dto: SendMessageDto,
  ) {
    return this.conversations.sendMessage(id, user.id, dto);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentUser() user: UserCtx) {
    return this.conversations.markRead(id, user.id);
  }
}
