import { Module } from '@nestjs/common';
import { AttestationsService } from './attestations.service';
import { AttestationsController } from './attestations.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../common/mail/mail.module';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [AttestationsController],
  providers: [AttestationsService],
  exports: [AttestationsService],
})
export class AttestationsModule {}
