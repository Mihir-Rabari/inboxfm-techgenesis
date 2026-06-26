import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { User, ActionItemStatus, ActionItemType } from "@prisma/client";
import { ActionItemsService } from "./action-items.service";

@Controller("action-items")
@UseGuards(AuthGuard("jwt"))
export class ActionItemsController {
  constructor(private readonly actionItemsService: ActionItemsService) {}

  /**
   * Get filtered list of action items
   */
  @Get()
  async getActionItems(
    @Req() req: Request,
    @Query("status") status?: ActionItemStatus,
    @Query("type") type?: ActionItemType,
    @Query("briefId") briefId?: string,
    @Query("limit") limitStr?: string,
  ) {
    const user = req.user as User;
    const limit = limitStr ? parseInt(limitStr, 10) : undefined;
    
    if (limit !== undefined && (isNaN(limit) || limit <= 0)) {
      throw new BadRequestException("Limit must be a positive integer");
    }

    return this.actionItemsService.getActionItems(user.id, {
      status,
      type,
      briefId,
      limit,
    });
  }

  /**
   * Get action items pending and other counts by status
   */
  @Get("counts")
  async getCounts(@Req() req: Request) {
    const user = req.user as User;
    return this.actionItemsService.getCounts(user.id);
  }

  /**
   * Get single action item details
   */
  @Get(":id")
  async getActionItem(@Req() req: Request, @Param("id") id: string) {
    const user = req.user as User;
    return this.actionItemsService.getActionItem(user.id, id);
  }

  /**
   * Update status of an action item
   */
  @Patch(":id/status")
  async updateStatus(
    @Req() req: Request,
    @Param("id") id: string,
    @Body("status") status: ActionItemStatus,
  ) {
    const user = req.user as User;
    
    if (!status) {
      throw new BadRequestException("Status is required");
    }

    return this.actionItemsService.updateStatus(user.id, id, status);
  }

  /**
   * Edit content of an action item
   */
  @Patch(":id")
  async updateActionItem(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    const user = req.user as User;
    return this.actionItemsService.updateActionItem(user.id, id, body);
  }

  /**
   * On-demand AI reply suggestions
   */
  @Post(":id/generate-reply")
  async generateReply(
    @Req() req: Request,
    @Param("id") id: string,
    @Body("promptDraft") promptDraft?: string,
  ) {
    const user = req.user as User;
    return this.actionItemsService.generateReply(user.id, id, promptDraft);
  }

  /**
   * Send mail reply via Outlook only
   */
  @Post(":id/send-mail")
  async sendMail(@Req() req: Request, @Param("id") id: string) {
    const user = req.user as User;
    return this.actionItemsService.sendMail(user.id, id);
  }

  /**
   * Sync meeting event to Google Calendar
   */
  @Post(":id/calendar-sync")
  async calendarSync(@Req() req: Request, @Param("id") id: string) {
    const user = req.user as User;
    return this.actionItemsService.calendarSync(user.id, id);
  }

  /**
   * Delete an action item
   */
  @Delete(":id")
  async deleteActionItem(@Req() req: Request, @Param("id") id: string) {
    const user = req.user as User;
    return this.actionItemsService.deleteActionItem(user.id, id);
  }
}
