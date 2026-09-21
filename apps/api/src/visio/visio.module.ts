import { Module } from '@nestjs/common';
import { VisioController, VisioPubliqueController } from './visio.controller';
import { VisioService } from './visio.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../common/mail/mail.module';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [VisioController, VisioPubliqueController],
  providers: [VisioService],
  exports: [VisioService],
})
export class VisioModule {}
