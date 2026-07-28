import { Module } from '@nestjs/common';
import { QuestionsController, PublicQuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { CommunityModule } from '../community/community.module';
import { AssistantModule } from '../assistant/assistant.module';

@Module({
  imports: [CommunityModule, AssistantModule],
  controllers: [QuestionsController, PublicQuestionsController],
  providers: [QuestionsService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
