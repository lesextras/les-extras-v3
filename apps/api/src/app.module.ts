import { Module } from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { SentryModule } from "@sentry/nestjs/setup";
import { AdminOverviewModule } from "./admin-overview/admin-overview.module";
import { AdminOffersModule } from "./admin-offers/admin-offers.module";
import { AdminFinanceModule } from "./admin-finance/admin-finance.module";
import { DeskModule } from "./desk/desk.module";
import { AdminUsersModule } from "./admin-users/admin-users.module";
import { AuthModule } from "./auth/auth.module";
import { BookingsModule } from "./bookings/bookings.module";
import { HealthController } from "./health.controller";
import { MissionsModule } from "./missions/missions.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ServicesModule } from "./services/services.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { InvoicesModule } from "./invoices/invoices.module";
import { UsersModule } from "./users/users.module";

import { ReviewsModule } from './reviews/reviews.module';
import { ConversationsModule } from './conversations/conversations.module';
import { MailModule } from './mail/mail.module';
import { QuotesModule } from './quotes/quotes.module';
import { EventsModule } from './events/events.module';
import { RequestLoggingInterceptor } from "./common/interceptors/request-logging.interceptor";

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        name: "default",
        ttl: 60000, // 1 minute window
        limit: 60,  // 60 requests per minute globally
      },
      // "auth" throttler is NOT registered globally here — it is applied only
      // to the AuthController via @Throttle({ auth: { ... } }) to avoid
      // accidentally capping all endpoints at 10 req/min.
    ]),
    PrismaModule,
    AdminOverviewModule,
    AdminUsersModule,
    AdminOffersModule,
    AdminFinanceModule,
    DeskModule,
    AuthModule,
    MissionsModule,
    ServicesModule,
    BookingsModule,
    NotificationsModule,
    InvoicesModule,
    UsersModule,

    ReviewsModule,
    ConversationsModule,
    MailModule,
    QuotesModule,
    EventsModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
  ],
})
export class AppModule { }
