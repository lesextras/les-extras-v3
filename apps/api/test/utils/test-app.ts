/**
 * Bootstrap d'une application Nest de test (lane QA-Security).
 *
 * Monte le vrai `AppModule` mais remplace `PrismaService` par un mock
 * in-memory, afin d'exercer controllers + guards + services réels sans
 * base Postgres.
 *
 * Hypothèses d'intégration (conventions AGENT_BRIEF.md) :
 *  - `AppModule` exporté depuis `src/app.module.ts`.
 *  - `PrismaService` exporté depuis `src/prisma/prisma.service.ts`.
 *  - Préfixe global `/api`, `ValidationPipe` global (comme en prod via main.ts).
 *  - Auth par header `Authorization: Bearer <jwt>` ; compte actif via `x-account-id`.
 *
 * Si l'un de ces points diffère, adapter UNIQUEMENT ce fichier — les specs
 * consomment les helpers ci-dessous et resteront stables.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';

import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';

import { createPrismaMock, PrismaMock } from './prisma-mock';

export interface TestContext {
  app: INestApplication;
  prisma: PrismaMock;
  jwt: JwtService;
  /** Forge un JWT d'accès valide pour un user donné. */
  tokenFor(user: { id: string; role?: string; email?: string }): string;
}

export async function createTestApp(): Promise<TestContext> {
  const prisma = createPrismaMock();

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  await app.init();

  const jwt = moduleRef.get(JwtService);

  const tokenFor = (user: { id: string; role?: string; email?: string }) =>
    jwt.sign(
      { sub: user.id, id: user.id, role: user.role ?? 'USER', email: user.email },
      { secret: process.env.JWT_SECRET },
    );

  return { app, prisma, jwt, tokenFor };
}
