import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { GmailModule } from "../gmail/gmail.module";
import { IntegrationsModule } from "../integrations/integrations.module";
import { WorkspaceController } from "./workspace.controller";
import { WorkspaceService } from "./workspace.service";

@Module({
  imports: [PrismaModule, GmailModule, IntegrationsModule],
  controllers: [WorkspaceController],
  providers: [WorkspaceService],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
