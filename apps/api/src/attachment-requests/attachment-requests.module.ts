import { Module } from '@nestjs/common';
import { AttachmentRequestsService } from './attachment-requests.service';
import { AttachmentRequestsController } from './attachment-requests.controller';

@Module({
  controllers: [AttachmentRequestsController],
  providers: [AttachmentRequestsService],
  exports: [AttachmentRequestsService],
})
export class AttachmentRequestsModule {}
