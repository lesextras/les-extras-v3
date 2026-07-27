import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { LinkedinService } from './linkedin.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [ArticlesController],
  providers: [ArticlesService, LinkedinService],
  exports: [ArticlesService],
})
export class ArticlesModule {}
