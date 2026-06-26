import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { ConfigModule } from "@nestjs/config";
import { SchedulerService } from "./scheduler.service";
import { BriefModule } from "../modules/brief/brief.module";
import { AuthModule } from "../modules/auth/auth.module";
import { MailModule } from "../modules/mail/mail.module";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    BriefModule,
    AuthModule,
    MailModule,
  ],
  providers: [SchedulerService],
})
export class SchedulerModule {}
