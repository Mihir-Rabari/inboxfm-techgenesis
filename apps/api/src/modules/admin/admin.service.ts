import { Injectable, NotFoundException } from "@nestjs/common";
import { WaitlistService } from "../waitlist/waitlist.service";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import * as crypto from "crypto";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";

import { MailService } from "../mail/mail.service";
import { ReleaseService } from "../release/release.service";

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly waitlistService: WaitlistService,
    private readonly notificationsService: NotificationsService,
    private readonly releaseService: ReleaseService,
    @InjectQueue("brief") private readonly briefQueue: Queue,
    @InjectQueue("release") private readonly releaseQueue: Queue,
  ) {}

  // User Management
  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        picture: true,
        gmailConnected: true,
        createdAt: true,
        lastActiveAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }
  async revokeUserAccess(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
      },
    });
  }

  // Analytics
  async getSystemAnalytics() {
    // Get queue stats
    const queueStats = await this.getQueueStats();

    // User stats
    const [
      totalUsers,
      activeUsers,
      newUsersThisWeek,
      totalWithPushNotifs,
      totalWithGmailConnected,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: {
          isActive: true,
          gmailConnected: true,
        },
      }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      this.prisma.pushSubscription.count({
        where: { isActive: true },
      }),
      this.prisma.user.count({
        where: { gmailConnected: true },
      }),
    ]);

    // Brief stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [briefsToday, totalBriefs, avgDurationResult, emailsProcessedResult] =
      await Promise.all([
        this.prisma.dailyBrief.count({
          where: {
            createdAt: {
              gte: today,
            },
          },
        }),
        this.prisma.dailyBrief.count(),
        this.prisma.dailyBrief.aggregate({
          _avg: {
            audioDuration: true,
          },
          where: {
            status: "DELIVERED",
            audioDuration: {
              not: null,
            },
          },
        }),
        this.prisma.dailyBrief.aggregate({
          _sum: {
            emailsProcessed: true,
          },
        }),
      ]);

    // Summary schedules count
    const totalSummaries = await this.prisma.summarySchedule.count();

    // Schedule heatmap (group by hour)
    const schedules = await this.prisma.summarySchedule.findMany({
      where: { isActive: true },
      select: { deliveryTime: true },
    });

    const scheduleHeatmap: Record<number, number> = {};
    for (let i = 0; i < 24; i++) scheduleHeatmap[i] = 0;

    schedules.forEach((s: any) => {
      const hour = parseInt(s.deliveryTime.split(":")[0], 10);
      if (!isNaN(hour)) {
        scheduleHeatmap[hour] = (scheduleHeatmap[hour] || 0) + 1;
      }
    });

    // User growth (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentUsers = await this.prisma.user.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    });

    const userGrowth: Record<string, number> = {};
    recentUsers.forEach((u: any) => {
      const dateKey = u.createdAt.toISOString().split("T")[0];
      userGrowth[dateKey] = (userGrowth[dateKey] || 0) + 1;
    });

    // Push notification stats
    const pushSubscriptionsByDay: Record<string, number> = {};
    const pushSubs = await this.prisma.pushSubscription.findMany({
      select: { createdAt: true },
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
    });
    pushSubs.forEach((sub: any) => {
      const dateKey = sub.createdAt.toISOString().split("T")[0];
      pushSubscriptionsByDay[dateKey] = (pushSubscriptionsByDay[dateKey] || 0) + 1;
    });

    return {
      totalUsers,
      activeUsers,
      newUsersThisWeek,
      totalBriefs,
      briefsToday,
      averageDuration: Math.round(avgDurationResult._avg.audioDuration || 0),
      processingQueue: queueStats.active + queueStats.waiting,
      queue: queueStats,
      // Push notification stats
      totalPushSubscriptions: totalWithPushNotifs,
      activeGmailUsers: totalWithGmailConnected,
      totalEmailsProcessed: emailsProcessedResult._sum.emailsProcessed || 0,
      totalSummaries,
      scheduleHeatmap,
      userGrowth,
      pushSubscriptionGrowth: pushSubscriptionsByDay,
    };
  }

  async sendMailToUsers(userIds: string[], subject: string, message: string) {
    const users = await this.prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: { email: true, name: true },
    });

    const sendPromises = users.map((user: any) =>
      this.mailService
        .sendBroadcast(user.email, subject, message)
        .catch((err: any) => {
          console.error(`Failed to send broadcast to ${user.email}:`, err);
        }),
    );

    await Promise.all(sendPromises);

    return { success: true, count: users.length };
  }

  async sendCustomMail(to: string, fromEmail: string, subject: string, message: string) {
    const from = fromEmail.endsWith("@vedlabs.tech") ? fromEmail : "notifications@vedlabs.tech";
    
    const htmlContent = `
      <div style="font-size: 15px; line-height: 1.6; color: #B8B8B8; font-family: 'Outfit', sans-serif;">
        ${this.mailService.parseMarkdownToHtml(message)}
      </div>
    `;

    await this.mailService.sendMarketingEmail(to, subject, htmlContent, from);
    return { success: true };
  }

  // Release Management
  async createRelease(data: {
    version: string;
    title: string;
    slug?: string;
    description?: string;
    content: string;
    changes?: any;
  }) {
    const slug =
      data.slug ||
      data.title
        .toLowerCase()
        .replace(/[^\w ]+/g, "")
        .replace(/ +/g, "-");

    return this.releaseService.create({
      version: data.version,
      title: data.title,
      slug,
      description: data.description,
      content: data.content,
      changes: data.changes || [],
      isPublished: false,
    });
  }

  async updateRelease(id: string, data: any) {
    if (data.title && !data.slug) {
      data.slug = data.title
        .toLowerCase()
        .replace(/[^\w ]+/g, "")
        .replace(/ +/g, "-");
    }

    return this.releaseService.update(id, data);
  }

  async deleteRelease(id: string) {
    return this.releaseService.delete(id);
  }

  async getReleases() {
    return this.prisma.releaseNote.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async broadcastRelease(id: string) {
    const release = await this.prisma.releaseNote.findUnique({
      where: { id },
    });

    if (!release) throw new NotFoundException("Release not found");

    // Update status first to prevent double sending if called concurrently
    await this.prisma.releaseNote.update({
      where: { id },
      data: { sentAt: new Date() },
    });

    // Get all active users
    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      select: { email: true, name: true },
    });

    // Send emails via queue
    const jobs = users.map((user: any) => ({
      name: "send-release-email",
      data: {
        email: user.email,
        name: user.name || "User",
        version: release.version,
        title: release.title,
        content: release.content,
      },
    }));

    await this.releaseQueue.addBulk(jobs);

    return { success: true, sentCount: users.length };
  }

  // Waitlist Management
  async getWaitlistEntries() {
    return this.waitlistService.getAllEntries();
  }

  async approveWaitlistEntry(id: string) {
    return this.waitlistService.approveEntry(id);
  }

  async rejectWaitlistEntry(id: string) {
    return this.waitlistService.rejectEntry(id);
  }

  async waitlistWaitlistEntry(id: string) {
    return this.waitlistService.waitlistEntry(id);
  }

  async deleteWaitlistEntry(id: string) {
    return this.waitlistService.deleteEntry(id);
  }

  private async getQueueStats() {
    try {
      const [active, waiting, completed, failed] = await Promise.all([
        this.briefQueue.getActiveCount(),
        this.briefQueue.getWaitingCount(),
        this.briefQueue.getCompletedCount(),
        this.briefQueue.getFailedCount(),
      ]);

      return {
        active,
        waiting,
        completed,
        failed,
      };
    } catch (error) {
      return {
        active: 0,
        waiting: 0,
        completed: 0,
        failed: 0,
      };
    }
  }
}
