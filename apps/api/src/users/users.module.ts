import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ProgressionService } from './progression.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, ProgressionService],
  exports: [UsersService, ProgressionService],
})
export class UsersModule {}
