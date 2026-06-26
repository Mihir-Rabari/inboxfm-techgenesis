import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Req,
  NotFoundException,
  Body,
  BadRequestException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { User } from "@prisma/client";
import { BriefService } from "./brief.service";
import { IntegrationsService } from "../integrations/integrations.service";
import { AiService } from "../ai/ai.service";

@Controller("briefs")
@UseGuards(AuthGuard("jwt"))
export class BriefController {
  constructor(
    private readonly briefService: BriefService,
    private readonly integrationsService: IntegrationsService,
    private readonly aiService: AiService,
  ) {}

  /**
   * Get user's recent briefs
   */
  @Get()
  async getBriefs(@Req() req: Request) {
    const user = req.user as User;
    return this.briefService.getUserBriefs(user.id);
  }

  @Get("stats")
  async getBriefStats(@Req() req: Request) {
    const user = req.user as User;
    return this.briefService.getUserBriefStats(user.id);
  }

  /**
   * Get specific brief
   */
  @Get(":id")
  async getBrief(@Req() req: Request, @Param("id") briefId: string) {
    const user = req.user as User;
    const brief = await this.briefService.getBrief(user.id, briefId);
    if (!brief) {
      throw new NotFoundException("Brief not found");
    }
    return brief;
  }

  /**
   * Get persisted action history for a brief
   */
  @Get(":id/actions-history")
  async getBriefActionHistory(
    @Req() req: Request,
    @Param("id") briefId: string,
  ) {
    const user = req.user as User;
    const history = await this.briefService.getBriefActionHistory(
      user.id,
      briefId,
    );
    if (!history) {
      throw new NotFoundException("Brief not found");
    }
    return { success: true, history };
  }

  /**
   * Trigger manual brief generation (for testing)
   */
  @Post("generate")
  async generateBrief(@Req() req: Request) {
    const user = req.user as User;
    const briefId = await this.briefService.queueBriefGeneration(user.id);
    return { briefId, message: "Brief generation queued" };
  }

  /**
   * Create calendar event from approved summary action
   */
  @Post(":id/calendar-events")
  async createCalendarEvent(
    @Param("id") id: string,
    @Req() req: Request,
    @Body()
    body: {
      sourceId?: string;
      type?: "event" | "reminder" | "meeting" | "task";
      title: string;
      details?: string;
      startsAt: string;
      endsAt?: string | null;
      allDay?: boolean;
      participants?: string[];
      includeMeet?: boolean;
      location?: string;
    },
  ) {
    const user = req.user as User;

    if (!body?.title || !body?.startsAt) {
      throw new BadRequestException("title and startsAt are required");
    }

    const result = await this.briefService.createCalendarEvent(
      user.id,
      id,
      body,
    );
    return { success: true, ...result };
  }

  /**
   * Delete brief
   */
  @Delete(":id")
  async deleteBrief(@Param("id") id: string, @Req() req: Request) {
    const user = req.user as User;
    await this.briefService.deleteBrief(id, user.id);
    return { success: true, message: "Brief deleted successfully" };
  }
}
