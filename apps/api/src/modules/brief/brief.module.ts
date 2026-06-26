import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { BriefService } from "./brief.service";
import { BriefController } from "./brief.controller";
import { BriefProcessor } from "./brief.processor";
import { IntegrationsModule } from "../integrations/integrations.module";
import { AiModule } from "../ai/ai.module";
import { AudioModule } from "../audio/audio.module";
import { DeliveryModule } from "../delivery/delivery.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { EncryptionUtil } from "../../utils/encryption.util";

@Module({
  imports: [
    BullModule.registerQueue({
      name: "brief",
      defaultJobOptions: {
        attempts: 1, // No retries — errors are reported via email, retrying just sends duplicates
        removeOnComplete: true,
        removeOnFail: false, // Keep failed jobs for debugging
      },
    }),
    IntegrationsModule,
    AiModule,
    AudioModule,
    DeliveryModule,
    NotificationsModule,
  ],
  controllers: [BriefController],
  providers: [BriefService, BriefProcessor, EncryptionUtil],
  exports: [BriefService],
})
export class BriefModule {}
