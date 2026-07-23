import { Module } from '@nestjs/common';
import { QualiopiController } from './qualiopi.controller';
import { QualiopiService } from './qualiopi.service';

@Module({
  controllers: [QualiopiController],
  providers: [QualiopiService],
  exports: [QualiopiService],
})
export class QualiopiModule {}
