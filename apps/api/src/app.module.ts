import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD, APP_FILTER } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { SentryModule, SentryGlobalFilter } from "@sentry/nestjs/setup";
import { BullModule } from "@nestjs/bull";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";

import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UserModule } from "./modules/user/user.module";
import { GmailModule } from "./modules/gmail/gmail.module";
import { AiModule } from "./modules/ai/ai.module";
import { AudioModule } from "./modules/audio/audio.module";
import { BriefModule } from "./modules/brief/brief.module";
import { DeliveryModule } from "./modules/delivery/delivery.module";
import { SchedulerModule } from "./scheduler/scheduler.module";

import { SummaryModule } from "./modules/summary/summary.module";
import { AdminModule } from "./modules/admin/admin.module";
import { MailModule } from "./modules/mail/mail.module";
import { SupportModule } from "./modules/support/support.module";
import { FeedbackModule } from "./modules/feedback/feedback.module";
import { WebhookModule } from "./modules/webhook/webhook.module";
import { HealthModule } from "./modules/health/health.module";
import { ReleaseModule } from "./modules/release/release.module";
import { WaitlistModule } from "./modules/waitlist/waitlist.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { IntegrationsModule } from "./modules/integrations/integrations.module";
import { ActionItemsModule } from "./modules/action-items/action-items.module";
import { StylesModule } from "./modules/styles/styles.module";
import { WorkspaceModule } from "./modules/workspace/workspace.module";

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env"],
    }),

    // Sentry
    SentryModule.forRoot(),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get("THROTTLE_TTL", 60000), // Default 60 seconds
          limit: config.get("THROTTLE_LIMIT", 60), // Default 60 requests
        },
      ],
    }),

    // Events
    EventEmitterModule.forRoot(),

    // Serve audio files
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "uploads"),
      serveRoot: "/uploads",
    }),

    // Bull Queue
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get("REDIS_HOST", "localhost"),
          port: configService.get("REDIS_PORT", 6379),
        },
      }),
      inject: [ConfigService],
    }),

    // Database
    PrismaModule,

    // Feature modules
    AuthModule,
    UserModule,
    GmailModule,
    AiModule,
    AudioModule,
    BriefModule,
    DeliveryModule,
    SchedulerModule,

    SummaryModule,
    AdminModule,
    MailModule,
    SupportModule,
    FeedbackModule,
    WebhookModule,
    HealthModule,
    ReleaseModule,
    WaitlistModule,
    NotificationsModule,
    IntegrationsModule,
    ActionItemsModule,
    StylesModule,
    WorkspaceModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class AppModule {}
