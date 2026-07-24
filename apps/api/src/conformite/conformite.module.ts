import { Module } from '@nestjs/common';
import { ConformiteController } from './conformite.controller';
import { ConformiteService } from './conformite.service';

@Module({
  controllers: [ConformiteController],
  providers: [ConformiteService],
  exports: [ConformiteService],
})
export class ConformiteModule {}
