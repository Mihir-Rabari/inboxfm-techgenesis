import { Module } from "@nestjs/common";
import { ActionItemsService } from "./action-items.service";
import { ActionItemsController } from "./action-items.controller";
import { IntegrationsModule } from "../integrations/integrations.module";
import { AiModule } from "../ai/ai.module";
import { EncryptionUtil } from "../../utils/encryption.util";

@Module({
  imports: [IntegrationsModule, AiModule],
  controllers: [ActionItemsController],
  providers: [ActionItemsService, EncryptionUtil],
  exports: [ActionItemsService],
})
export class ActionItemsModule {}
