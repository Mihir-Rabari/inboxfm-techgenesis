import { Module } from "@nestjs/common";
import { StylesService } from "./styles.service";
import { StylesController } from "./styles.controller";

@Module({
  controllers: [StylesController],
  providers: [StylesService],
  exports: [StylesService],
})
export class StylesModule {}
