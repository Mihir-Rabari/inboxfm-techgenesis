import { Body, Controller, Post, Delete, Get, Req, UseGuards, BadRequestException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { User } from "@prisma/client";
import { NotificationsService } from "./notifications.service";

interface PushSubscriptionJSON {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

@Controller("notifications")
@UseGuards(AuthGuard("jwt"))
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post("subscribe")
  async subscribe(
    @Req() req: Request,
    @Body() body: { subscription: PushSubscriptionJSON },
  ) {
    const user = req.user as User;
    if (!body?.subscription) {
      throw new BadRequestException("Subscription object is required");
    }
    return this.notificationsService.upsertSubscription(user.id, body.subscription);
  }

  @Get("subscription")
  async getSubscription(@Req() req: Request) {
    const user = req.user as User;
    return this.notificationsService.getSubscription(user.id);
  }

  @Delete("unsubscribe")
  async unsubscribe(@Req() req: Request, @Body() body: { endpoint: string }) {
    const user = req.user as User;
    if (!body?.endpoint) {
      throw new BadRequestException("Endpoint is required");
    }
    // Verify endpoint belongs to user by checking if they have this subscription
    const subscription = await this.notificationsService.getSubscription(user.id);
    if (!subscription || subscription.endpoint !== body.endpoint) {
      throw new BadRequestException("Subscription not found");
    }
    return this.notificationsService.removeSubscription(body.endpoint);
  }

  @Post("send-test")
  async sendTestNotification(@Req() req: Request) {
    const user = req.user as User;
    return this.notificationsService.sendNotification(user.id, {
      title: "Inbox FM Notification",
      body: "This is a test notification from Inbox FM",
      data: {
        tag: "test-notification",
        url: "/dashboard",
      },
    });
  }
}
