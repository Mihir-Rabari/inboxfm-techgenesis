import {
  Controller,
  Get,
  Patch,
  Put,
  Delete,
  Body,
  UseGuards,
  Req,
  Param,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { User } from "@prisma/client";
import {
  UserService,
  UpdatePreferencesDto,
  UpsertSenderPreferenceDto,
} from "./user.service";

@Controller("users")
@UseGuards(AuthGuard("jwt"))
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get("me")
  async getProfile(@Req() req: Request) {
    const user = req.user as User;
    return this.userService.getUser(user.id);
  }

  @Get("me/briefs")
  async getMyBriefs(@Req() req: Request) {
    const user = req.user as User;
    return this.userService.getUserWithBriefs(user.id);
  }

  @Patch("me/preferences")
  async updatePreferences(
    @Req() req: Request,
    @Body() dto: UpdatePreferencesDto,
  ) {
    const user = req.user as User;
    return this.userService.updatePreferences(user.id, dto);
  }

  @Get("me/sender-preferences")
  async getSenderPreferences(@Req() req: Request) {
    const user = req.user as User;
    return this.userService.getSenderPreferences(user.id);
  }

  @Put("me/sender-preferences")
  async upsertSenderPreference(
    @Req() req: Request,
    @Body() dto: UpsertSenderPreferenceDto,
  ) {
    const user = req.user as User;
    return this.userService.upsertSenderPreference(user.id, dto);
  }

  @Delete("me/sender-preferences/:senderEmail")
  async deleteSenderPreference(
    @Req() req: Request,
    @Param("senderEmail") senderEmail: string,
  ) {
    const user = req.user as User;
    return this.userService.deleteSenderPreference(user.id, senderEmail);
  }
}
