import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { User } from "@prisma/client";
import { WorkspaceService } from "./workspace.service";

@Controller("workspace")
@UseGuards(AuthGuard("jwt"))
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Get("feed")
  async getFeed(@Req() req: Request) {
    const user = req.user as User;
    return this.workspaceService.getFeed(user.id);
  }

  @Get("calendar")
  async getCalendar(@Req() req: Request) {
    const user = req.user as User;
    return this.workspaceService.getCalendar(user.id);
  }
}
