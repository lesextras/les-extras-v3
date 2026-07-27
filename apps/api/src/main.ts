import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false, rawBody: true });
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Préfixe global : toutes les routes sont servies sous /api
  app.setGlobalPrefix('api');

  // Validation stricte des DTO (class-validator / class-transformer)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Filtre d'exception uniformisé (réponses JSON normalisées)
  app.useGlobalFilters(new HttpExceptionFilter());

  // CORS : autorise le front (cookie/session + header x-account-id)
  const corsOrigins = config.get<string>('CORS_ORIGINS');
  app.enableCors({
    origin: corsOrigins ? corsOrigins.split(',').map((o) => o.trim()) : true,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-account-id'],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  const port = config.get<number>('API_PORT') ?? 3001;
  app.use(helmet());
  await app.listen(port);
  logger.log(`LES EXTRAS API en écoute sur http://localhost:${port}/api`);
}

bootstrap();
