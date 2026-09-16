import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { UsersModule } from '../users/users.module';
import { StructuresModule } from '../structures/structures.module';

/**
 * Module PUBLIC : catalogue consultable sans connexion.
 * PrismaService est fourni par le PrismaModule global.
 */
@Module({
  imports: [UsersModule, StructuresModule],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
