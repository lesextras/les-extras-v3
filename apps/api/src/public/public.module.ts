import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';

/**
 * Module PUBLIC : catalogue consultable sans connexion.
 * PrismaService est fourni par le PrismaModule global.
 */
@Module({
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
