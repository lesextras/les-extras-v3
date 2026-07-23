import { Module } from '@nestjs/common';
import { TutoratController } from './tutorat.controller';
import { TutoratService } from './tutorat.service';

@Module({
  controllers: [TutoratController],
  providers: [TutoratService],
  exports: [TutoratService],
})
export class TutoratModule {}
