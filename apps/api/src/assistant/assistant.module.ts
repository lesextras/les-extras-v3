import { Module } from '@nestjs/common';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { PseudonymiseurService } from './pseudonymiseur.service';
import { MistralService } from './mistral.service';

@Module({
  controllers: [AssistantController],
  providers: [AssistantService, PseudonymiseurService, MistralService],
  exports: [AssistantService],
})
export class AssistantModule {}
