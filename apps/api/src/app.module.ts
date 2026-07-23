import { HealthModule } from './health/health.module';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

// --- Infrastructure (Backend-Core) ---
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './common/mail/mail.module';

// --- Cœur identité / multi-comptes (Backend-Core) ---
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AccountsModule } from './accounts/accounts.module';
import { MembershipsModule } from './memberships/memberships.module';
import { InvitationsModule } from './invitations/invitations.module';

// --- Marketplace (Backend-Marketplace : dossiers séparés) ---
import { MissionsModule } from './missions/missions.module';
import { BookingsModule } from './bookings/bookings.module';
import { ServicesModule } from './services/services.module';
import { ConversationsModule } from './conversations/conversations.module';
import { ReviewsModule } from './reviews/reviews.module';
import { NotificationsModule } from './notifications/notifications.module';
import { InvoicesModule } from './invoices/invoices.module';
import { AdminModule } from './admin/admin.module';
import { CategoriesModule } from './categories/categories.module';
import { MatchingModule } from './matching/matching.module';
import { PlanningModule } from './planning/planning.module';
import { PublicModule } from './public/public.module';
import { FormationsModule } from './formations/formations.module';

@Module({
  imports: [
    HealthModule,
    // Rate limiting global : 120 requêtes / minute / IP (anti brute-force & abus).
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    // Globaux : disponibles partout sans réimport.
    ConfigModule,
    PrismaModule,
    MailModule,

    // Cœur.
    AuthModule,
    UsersModule,
    AccountsModule,
    MembershipsModule,
    InvitationsModule,

    // Marketplace.
    MissionsModule,
    BookingsModule,
    ServicesModule,
    ConversationsModule,
    ReviewsModule,
    NotificationsModule,
    InvoicesModule,
    AdminModule,
    CategoriesModule,
    MatchingModule,
    PlanningModule,

    // Centre de formation (Qualiopi) — programmes / sessions / inscriptions.
    FormationsModule,

    // Vitrine publique (non authentifiée).
    PublicModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
