import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import * as webpush from "web-push";

interface PushSubscriptionJSON {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {
    this.setupWebPush();
  }

  private setupWebPush() {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    if (!vapidPublicKey || !vapidPrivateKey) {
      this.logger.warn("VAPID keys not configured - push notifications disabled");
      return;
    }

    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:noreply@vedlabs.tech",
      vapidPublicKey,
      vapidPrivateKey
    );
  }

  async upsertSubscription(userId: string, subscription: PushSubscriptionJSON) {
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      throw new BadRequestException("Invalid subscription object");
    }

    await this.prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        isActive: true,
      },
    });

    this.logger.log(`Stored notification subscription for user ${userId}`);
    return { success: true, message: "Subscription saved" };
  }

  async getSubscription(userId: string) {
    return this.prisma.pushSubscription.findFirst({
      where: {
        userId,
        isActive: true,
      },
    });
  }

  async getUserSubscriptions(userId: string) {
    return this.prisma.pushSubscription.findMany({
      where: {
        userId,
        isActive: true,
      },
    });
  }

  async removeSubscription(endpoint: string) {
    await this.prisma.pushSubscription.update({
      where: { endpoint },
      data: { isActive: false },
    });
    this.logger.log(`Removed notification subscription for endpoint ${endpoint}`);
    return { success: true };
  }

  async sendNotification(userId: string, notification: { title: string; body: string; data?: Record<string, any> }) {
    const subscriptions = await this.getUserSubscriptions(userId);

    if (subscriptions.length === 0) {
      this.logger.warn(`No active subscriptions for user ${userId}`);
      return { success: false, message: "No subscriptions found", sent: 0 };
    }

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      tag: notification.data?.tag || "default",
      data: notification.data || {},
    });

    let successCount = 0;
    const errors: string[] = [];

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        );
        successCount++;
      } catch (error: any) {
        this.logger.error(`Failed to send notification: ${error.message}`);

        // Mark subscription as inactive if endpoint is invalid
        if (error.statusCode === 410 || error.statusCode === 404) {
          await this.removeSubscription(sub.endpoint).catch(() => {});
        }

        errors.push(error.message);
      }
    }

    return {
      success: successCount > 0,
      sent: successCount,
      failed: subscriptions.length - successCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async sendBroadcast(notification: { title: string; body: string; data?: Record<string, any> }, userIds?: string[]) {
    let query: { isActive: boolean; userId?: { in: string[] } } = { isActive: true };
    if (userIds && userIds.length > 0) {
      query.userId = { in: userIds };
    }

    const subscriptions = await this.prisma.pushSubscription.findMany({ where: query });

    if (subscriptions.length === 0) {
      return { success: false, message: "No subscriptions found", sent: 0 };
    }

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      tag: notification.data?.tag || "broadcast",
      data: notification.data || {},
    });

    let successCount = 0;
    const errors: string[] = [];

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        );
        successCount++;
      } catch (error: any) {
        this.logger.error(`Failed to send broadcast notification: ${error.message}`);

        if (error.statusCode === 410 || error.statusCode === 404) {
          await this.removeSubscription(sub.endpoint).catch(() => {});
        }

        errors.push(error.message);
      }
    }

    return {
      success: successCount > 0,
      sent: successCount,
      failed: subscriptions.length - successCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}

