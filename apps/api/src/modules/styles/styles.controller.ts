import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { User } from "@prisma/client";
import { StylesService } from "./styles.service";

@Controller("styles")
@UseGuards(AuthGuard("jwt"))
export class StylesController {
  constructor(private readonly stylesService: StylesService) {}

  @Get()
  async getStyles(@Req() req: Request) {
    const user = req.user as User;
    return this.stylesService.getStyles(user.id);
  }

  @Get(":id")
  async getStyle(@Req() req: Request, @Param("id") id: string) {
    const user = req.user as User;
    return this.stylesService.getStyle(user.id, id);
  }

  @Post()
  async createStyle(
    @Req() req: Request,
    @Body() body: { name: string; description?: string; prompt: string; isDefault?: boolean },
  ) {
    const user = req.user as User;
    return this.stylesService.createStyle(user.id, body);
  }

  @Patch(":id")
  async updateStyle(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() body: { name?: string; description?: string; prompt?: string; isDefault?: boolean },
  ) {
    const user = req.user as User;
    return this.stylesService.updateStyle(user.id, id, body);
  }

  @Post(":id/default")
  async setDefault(@Req() req: Request, @Param("id") id: string) {
    const user = req.user as User;
    return this.stylesService.setDefault(user.id, id);
  }

  @Delete(":id")
  async deleteStyle(@Req() req: Request, @Param("id") id: string) {
    const user = req.user as User;
    return this.stylesService.deleteStyle(user.id, id);
  }
}
