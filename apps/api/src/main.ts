import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as Sentry from '@sentry/node';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { exceptionValidationFr } from './common/validation/messages-fr';

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

  // Validation stricte des DTO (class-validator / class-transformer).
  // `exceptionFactory` traduit les messages : sans elle, l'utilisateur d'une
  // interface entièrement en français recevait « title must be longer than or
  // equal to 3 characters » dès qu'un champ était mal rempli.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: exceptionValidationFr,
    }),
  );

  // Filtre d'exception uniformisé (réponses JSON normalisées)
  app.useGlobalFilters(new HttpExceptionFilter());

  // CORS : autorise le front (cookie/session + header x-account-id).
  //
  // Le repli valait `origin: true` — c'est-à-dire « n'importe quelle origine,
  // avec les identifiants de session ». Combiné à `credentials: true`, cela
  // autorise n'importe quel site à appeler l'API au nom d'un utilisateur
  // connecté, et à en lire la réponse. Une variable d'environnement oubliée au
  // déploiement suffisait donc à ouvrir la porte. Le repli est désormais la
  // liste du site de production, et localhost n'y figure que hors production.
  const corsOrigins = config.get<string>('CORS_ORIGINS');
  const originesParDefaut = [
    'https://les-extras.fr',
    'https://www.les-extras.fr',
    ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000'] : []),
  ];
  app.enableCors({
    origin: corsOrigins
      ? corsOrigins
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean)
      : originesParDefaut,
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
