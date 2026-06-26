import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { ReleaseProcessor } from "./release.processor";
import { PrismaModule } from "../../prisma/prisma.module";
import { MailModule } from "../mail/mail.module";
import { WaitlistModule } from "../waitlist/waitlist.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { ReleaseModule } from "../release/release.module";

@Module({
  imports: [
    PrismaModule,
    MailModule,
    WaitlistModule,
    NotificationsModule,
    ReleaseModule,
    BullModule.registerQueue({
      name: "brief",
    }),
    BullModule.registerQueue({
      name: "release",
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService, ReleaseProcessor],
  exports: [AdminService],
})
export class AdminModule {}
