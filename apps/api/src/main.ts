import type { ServerResponse } from 'node:http';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as Sentry from '@sentry/node';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { exceptionValidationFr } from './common/validation/messages-fr';

/** Valeurs qu'on rencontre dans un fichier d'exemple, jamais en production. */
const SECRETS_BIDON = new Set([
  'secret',
  'changeme',
  'change-me',
  'dev',
  'test',
  'password',
  'motdepasse',
  'lesextras',
  'les-extras',
  'votre-secret',
  'your-secret-here',
]);

/** Longueur en deca de laquelle un secret ne protege plus grand-chose. */
const LONGUEUR_MINIMALE = 32;

function verifierLesSecrets(config: ConfigService, logger: Logger): void {
  for (const nom of ['JWT_SECRET', 'SESSION_SECRET']) {
    const valeur = config.get<string>(nom)?.trim() ?? '';
    if (valeur === '') {
      continue; // Absent : AuthModule s'en charge, avec un message plus precis.
    }
    if (SECRETS_BIDON.has(valeur.toLowerCase())) {
      throw new Error(
        `${nom} vaut une valeur d'exemple. Posez un vrai secret : openssl rand -hex 32`,
      );
    }
    if (valeur.length < LONGUEUR_MINIMALE) {
      logger.error(
        `${nom} ne fait que ${valeur.length} caracteres. En dessous de ${LONGUEUR_MINIMALE}, ` +
          "un jeton se casse hors ligne. A remplacer des que possible : openssl rand -hex 32",
      );
    }
  }
}

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

  // LA FORCE DES SECRETS, DITE AU DEMARRAGE.
  //
  // Un secret absent fait deja echouer le demarrage (getOrThrow dans
  // AuthModule). Ce qui passait sans bruit, c'est un secret PRESENT mais
  // court : « lesextras », « dev », un mot de passe de test oublie. Un jeton
  // signe avec un secret de huit caracteres se casse hors ligne en quelques
  // heures, et celui qui y arrive se connecte comme n'importe qui.
  //
  // On refuse de demarrer sur une valeur manifestement bidon, et on crie fort
  // sur une valeur courte — sans bloquer, parce qu'un refus ici couperait le
  // service en pleine nuit pour un secret qui, lui, existe.
  verifierLesSecrets(config, logger);

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
  /*
    ⚠ `Permissions-Policy` N'EST PAS DANS HELMET, et son absence s'est vue à
    l'audit du 21/09/2026 : le web le portait, l'API non. Helmet pose HSTS, la
    CSP, `X-Frame-Options`, `nosniff` et `Referrer-Policy`, mais pas celui-là.

    Ce que ça change concrètement : l'API ne rend jamais de page, mais elle rend
    des documents — factures, devis, attestations, contrats en PDF — que le
    navigateur ouvre dans son propre visualiseur, sur l'origine de l'API. Cet
    en-tête coupe d'avance l'accès à la caméra, au micro et à la géolocalisation
    depuis ce contexte.

    ⚠ NE PAS Y AJOUTER `camera=()` EN CROYANT DURCIR LA VISIOCONSULTATION : la
    salle vit sur le domaine du WEB, pas sur celui de l'API. La liste ci-dessous
    n'a donc aucun effet sur elle — et si quelqu'un déplaçait un jour la salle
    ici, c'est cette ligne qui l'empêcherait de fonctionner, sans message
    d'erreur explicite.
  */
  app.use((_req: unknown, res: ServerResponse, next: () => void) => {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    next();
  });
  await app.listen(port);
  logger.log(`LES EXTRAS API en écoute sur http://localhost:${port}/api`);
}

bootstrap();
