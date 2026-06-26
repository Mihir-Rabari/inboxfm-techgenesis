import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AdminGuard } from "./admin.guard";
import { AdminService } from "./admin.service";
import { NotificationsService } from "../notifications/notifications.service";

@Controller("admin")
@UseGuards(AuthGuard("jwt"), AdminGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // User Management
  @Get("users")
  async getUsers() {
    return this.adminService.getAllUsers();
  }

  @Delete("users/:id/revoke")
  async revokeUser(@Param("id") id: string) {
    return this.adminService.revokeUserAccess(id);
  }

  // Analytics
  @Get("analytics")
  async getAnalytics() {
    return this.adminService.getSystemAnalytics();
  }

  // Push Notifications
  @Post("notifications/send")
  async sendNotification(
    @Body()
    body: {
      userIds: string[];
      title: string;
      body: string;
      data?: Record<string, any>;
    },
  ) {
    if (!body?.userIds || !body?.title || !body?.body) {
      throw new Error("userIds, title, and body are required");
    }

    const results = [];
    for (const userId of body.userIds) {
      const result = await this.notificationsService.sendNotification(
        userId,
        {
          title: body.title,
          body: body.body,
          data: body.data,
        }
      );
      results.push({ userId, ...result });
    }

    return { success: true, results };
  }

  @Post("notifications/broadcast")
  async broadcastNotification(
    @Body()
    body: {
      title: string;
      body: string;
      data?: Record<string, any>;
    },
  ) {
    if (!body?.title || !body?.body) {
      throw new Error("title and body are required");
    }

    return this.notificationsService.sendBroadcast({
      title: body.title,
      body: body.body,
      data: body.data,
    });
  }

  // Releases
  @Get("releases")
  async getReleases() {
    return this.adminService.getReleases();
  }

  @Post("releases")
  async createRelease(
    @Body()
    body: {
      version: string;
      title: string;
      slug?: string;
      description?: string;
      content: string;
      changes?: any;
    },
  ) {
    return this.adminService.createRelease(body);
  }

  @Patch("releases/:id")
  async updateRelease(@Param("id") id: string, @Body() body: any) {
    return this.adminService.updateRelease(id, body);
  }

  @Delete("releases/:id")
  async deleteRelease(@Param("id") id: string) {
    return this.adminService.deleteRelease(id);
  }

  @Post("releases/:id/broadcast")
  async broadcastRelease(@Param("id") id: string) {
    return this.adminService.broadcastRelease(id);
  }

  // Email Communications
  @Post("mail/send")
  async sendEmail(
    @Body() body: { userIds: string[]; subject: string; message: string },
  ) {
    return this.adminService.sendMailToUsers(
      body.userIds,
      body.subject,
      body.message,
    );
  }

  @Post("mail/send-custom")
  async sendCustomEmail(
    @Body() body: { to: string; fromEmail: string; subject: string; message: string },
  ) {
    if (!body.to || !body.fromEmail || !body.subject || !body.message) {
      throw new Error("to, fromEmail, subject, and message are required");
    }
    return this.adminService.sendCustomMail(
      body.to,
      body.fromEmail,
      body.subject,
      body.message,
    );
  }

  // Waitlist Management
  @Get("waitlist")
  async getWaitlist() {
    return this.adminService.getWaitlistEntries();
  }

  @Post("waitlist/:id/approve")
  async approveWaitlist(@Param("id") id: string) {
    return this.adminService.approveWaitlistEntry(id);
  }

  @Post("waitlist/:id/reject")
  async rejectWaitlist(@Param("id") id: string) {
    return this.adminService.rejectWaitlistEntry(id);
  }

  @Post("waitlist/:id/waitlist")
  async waitlistWaitlist(@Param("id") id: string) {
    return this.adminService.waitlistWaitlistEntry(id);
  }

  @Delete("waitlist/:id")
  async deleteWaitlist(@Param("id") id: string) {
    return this.adminService.deleteWaitlistEntry(id);
  }
}
