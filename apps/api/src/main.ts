import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as Sentry from '@sentry/node';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  // Monitoring d'erreurs : actif seulement si SENTRY_DSN est posée — sans
  // elle, Sentry est un no-op et l'API tourne exactement comme avant.
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV ?? 'production',
      // Pas de traçage de performance : on ne veut que les erreurs.
      tracesSampleRate: 0,
    });
  }
  const app = await NestFactory.create(AppModule, { bufferLogs: false, rawBody: true });
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Derrière le proxy de Coolify (Traefik), `req.ip` valait l'adresse INTERNE
  // du réseau Docker (::ffff:10.0.1.x) : le journal d'audit et les traces de
  // signature enregistraient la même IP pour tout le monde. `trust proxy: 1`
  // fait lire l'en-tête X-Forwarded-For posé par le proxy — un seul saut de
  // confiance, pour ne pas croire une en-tête forgée par le client lui-même.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

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
