import { HealthModule } from './health/health.module';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

// --- Infrastructure (Backend-Core) ---
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './common/audit/audit.module';
import { StorageModule } from './storage/storage.module';
import { MailModule } from './common/mail/mail.module';

// --- Cœur identité / multi-comptes (Backend-Core) ---
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AccountsModule } from './accounts/accounts.module';
import { MembershipsModule } from './memberships/memberships.module';
import { UnitsModule } from './units/units.module';
import { InvitationsModule } from './invitations/invitations.module';

// --- Marketplace (Backend-Marketplace : dossiers séparés) ---
import { MissionsModule } from './missions/missions.module';
import { BookingsModule } from './bookings/bookings.module';
import { ServicesModule } from './services/services.module';
import { ConversationsModule } from './conversations/conversations.module';
import { ReviewsModule } from './reviews/reviews.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PushModule } from './push/push.module';
import { InvoicesModule } from './invoices/invoices.module';
import { BillingModule } from './billing/billing.module';
import { QuotesModule } from './quotes/quotes.module';
import { FavoritesModule } from './favorites/favorites.module';
import { CommunityModule } from './community/community.module';
import { QuestionsModule } from './questions/questions.module';
import { AssistantModule } from './assistant/assistant.module';
import { ArticlesModule } from './articles/articles.module';
import { AdminModule } from './admin/admin.module';
import { CategoriesModule } from './categories/categories.module';
import { MatchingModule } from './matching/matching.module';
import { PlanningModule } from './planning/planning.module';
import { PublicModule } from './public/public.module';
import { FormationsModule } from './formations/formations.module';
import { QualiopiModule } from './qualiopi/qualiopi.module';
import { TutoratModule } from './tutorat/tutorat.module';
import { ConformiteModule } from './conformite/conformite.module';
import { ContratsModule } from './contrats/contrats.module';
import { DocumentsModule } from './documents/documents.module';

@Module({
  imports: [
    HealthModule,
    // Rate limiting global : 120 requêtes / minute / IP (anti brute-force & abus).
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    // Globaux : disponibles partout sans réimport.
    ConfigModule,
    PrismaModule,
    AuditModule,
    StorageModule,
    MailModule,

    // Cœur.
    AuthModule,
    UsersModule,
    AccountsModule,
    MembershipsModule,
    UnitsModule,
    InvitationsModule,

    // Marketplace.
    MissionsModule,
    BookingsModule,
    ServicesModule,
    ConversationsModule,
    ReviewsModule,
    NotificationsModule,
    PushModule,
    InvoicesModule,
    BillingModule,
    QuotesModule,
    ArticlesModule,
    FavoritesModule,
    AssistantModule,
    CommunityModule,
    QuestionsModule,
    AdminModule,
    CategoriesModule,
    MatchingModule,
    PlanningModule,

    // Centre de formation (Qualiopi) — programmes / sessions / inscriptions.
    FormationsModule,
    QualiopiModule,
    TutoratModule,

    // Coffre-fort de conformité (pièces obligatoires des intervenants).
    ConformiteModule,
    ContratsModule,
    DocumentsModule,

    // Vitrine publique (non authentifiée).
    PublicModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
