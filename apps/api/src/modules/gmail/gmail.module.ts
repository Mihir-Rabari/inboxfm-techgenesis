import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { GmailService } from "./gmail.service";
import { EncryptionUtil } from "../../utils/encryption.util";

@Module({
  imports: [ConfigModule],
  providers: [GmailService, EncryptionUtil],
  exports: [GmailService, EncryptionUtil],
})
export class GmailModule {}
