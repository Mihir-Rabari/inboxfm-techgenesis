import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { PrismaService } from "../../prisma/prisma.service";
import { BriefStatus, DailyBrief } from "@prisma/client";
import { AudioService } from "../audio/audio.service";
import { ConfigService } from "@nestjs/config";
import { EncryptionUtil } from "../../utils/encryption.util";
import { google } from "googleapis";

@Injectable()
export class BriefService {
  private readonly logger = new Logger(BriefService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue("brief") private readonly briefQueue: Queue,
    private readonly audioService: AudioService,
    private readonly configService: ConfigService,
    private readonly encryptionUtil: EncryptionUtil,
  ) {}

  /**
   * Queue a brief generation job for a user
   */
  async queueBriefGeneration(
    userId: string,
    scheduleId?: string,
    scheduleMetadata?: { voicePersona?: string; customPrompt?: string },
  ): Promise<string> {
    // For testing: use upsert to allow unlimited regenerations
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Upsert - find existing or create new, then reset to PENDING
    const existing = await this.prisma.dailyBrief.findFirst({
      where: { userId, date: today, scheduleId: scheduleId ?? null },
      select: { id: true },
    });

    let brief: { id: string };
    if (existing) {
      brief = await this.prisma.dailyBrief.update({
        where: { id: existing.id },
        data: {
          status: "PENDING",
          textSummary: "",
          scriptJson: [],
          audioUrl: null,
          audioDuration: null,
          emailsProcessed: 0,
          errorMessage: null,
        },
        select: { id: true },
      });
    } else {
      brief = await this.prisma.dailyBrief.create({
        data: {
          userId,
          date: today,
          scheduleId: scheduleId ?? null,
          textSummary: "",
          scriptJson: [],
          status: "PENDING",
        },
        select: { id: true },
      });
    }

    // Add job to queue with schedule metadata
    await this.briefQueue.add(
      "generate",
      { userId, briefId: brief.id, scheduleId, scheduleMetadata },
      {
        attempts: 1, // No retries — BriefProcessor sends error email on failure, retrying = duplicate emails
        removeOnComplete: true,
        removeOnFail: false, // Keep for debugging
      },
    );

    this.logger.log(
      `Queued brief generation for user ${userId} (schedule: ${scheduleId})`,
    );
    return brief.id;
  }

  /**
   * Create a Google Calendar event for a brief action (with optional Google Meet)
   */
  async createCalendarEvent(
    userId: string,
    briefId: string,
    payload: {
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
    const brief = await this.prisma.dailyBrief.findFirst({
      where: { id: briefId, userId },
      select: { id: true },
    });

    if (!brief) {
      throw new BadRequestException("Brief not found or access denied");
    }

    const participants = (payload.participants || [])
      .map((email) => (email || "").trim())
      .filter((email) => /.+@.+\..+/.test(email));

    const startDate = new Date(payload.startsAt);
    if (Number.isNaN(startDate.getTime())) {
      throw new BadRequestException("Invalid startsAt datetime");
    }

    const endDate = payload.endsAt
      ? new Date(payload.endsAt)
      : new Date(startDate.getTime() + 30 * 60 * 1000);

    const sourceId = this.buildActionSourceId(payload, startDate);

    const action = await (this.prisma as any).briefAction.upsert({
      where: {
        briefId_sourceId: {
          briefId,
          sourceId,
        },
      },
      create: {
        briefId,
        userId,
        sourceId,
        type: payload.type,
        title: payload.title,
        details: payload.details || "",
        startsAt: startDate,
        endsAt: endDate,
        allDay: !!payload.allDay,
        participants,
        includeMeet: !!payload.includeMeet,
        location: payload.location,
        status: "PROCESSING",
        errorMessage: null,
        completedAt: null,
      },
      update: {
        type: payload.type,
        title: payload.title,
        details: payload.details || "",
        startsAt: startDate,
        endsAt: endDate,
        allDay: !!payload.allDay,
        participants,
        includeMeet: !!payload.includeMeet,
        location: payload.location,
        status: "PROCESSING",
        errorMessage: null,
        completedAt: null,
      },
      select: {
        id: true,
        sourceId: true,
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        accessToken: true,
        refreshToken: true,
        tokenExpiry: true,
        gmailConnected: true,
      },
    });

    if (!user || !user.gmailConnected || !user.accessToken) {
      await (this.prisma as any).briefAction.update({
        where: { id: action.id },
        data: {
          status: "FAILED",
          errorMessage:
            "Gmail/Calendar not connected. Please reconnect Google account.",
        },
      });
      throw new UnauthorizedException(
        "Gmail/Calendar not connected. Please reconnect Google account.",
      );
    }

    const accessToken = this.encryptionUtil.decrypt(user.accessToken);
    const refreshToken = user.refreshToken
      ? this.encryptionUtil.decrypt(user.refreshToken)
      : undefined;

    const clientId = this.configService.get<string>("GOOGLE_CLIENT_ID");
    const clientSecret = this.configService.get<string>("GOOGLE_CLIENT_SECRET");
    const auth = new google.auth.OAuth2(clientId, clientSecret);

    auth.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: user.tokenExpiry ? user.tokenExpiry.getTime() : undefined,
    });

    auth.on("tokens", async (tokens) => {
      if (!tokens.access_token) return;
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          accessToken: this.encryptionUtil.encrypt(tokens.access_token),
          ...(tokens.refresh_token && {
            refreshToken: this.encryptionUtil.encrypt(tokens.refresh_token),
          }),
          tokenExpiry: tokens.expiry_date
            ? new Date(tokens.expiry_date)
            : undefined,
        },
      });
    });

    const expiresAt = user.tokenExpiry ? user.tokenExpiry.getTime() : 0;
    if (
      (!expiresAt || expiresAt < Date.now() + 5 * 60 * 1000) &&
      refreshToken
    ) {
      await auth.refreshAccessToken();
    }

    const calendar = google.calendar({ version: "v3", auth });

    const isAllDay = !!payload.allDay;

    let created: any;

    try {
      const eventRes = await calendar.events.insert({
        calendarId: "primary",
        conferenceDataVersion: payload.includeMeet ? 1 : 0,
        requestBody: {
          summary: payload.title,
          description: payload.details || "",
          location: payload.location,
          attendees: participants.map((email) => ({ email })),
          start: isAllDay
            ? { date: startDate.toISOString().slice(0, 10) }
            : { dateTime: startDate.toISOString() },
          end: isAllDay
            ? { date: endDate.toISOString().slice(0, 10) }
            : { dateTime: endDate.toISOString() },
          conferenceData: payload.includeMeet
            ? {
                createRequest: {
                  requestId: `brief-${briefId}-${Date.now()}`,
                  conferenceSolutionKey: { type: "hangoutsMeet" },
                },
              }
            : undefined,
        },
        sendUpdates: participants.length > 0 ? "all" : "none",
      });
      created = eventRes.data;
    } catch (error: any) {
      const msg = String(error?.message || "Failed to create calendar event");

      await (this.prisma as any).briefAction.update({
        where: { id: action.id },
        data: {
          status: "FAILED",
          errorMessage: msg,
        },
      });

      if (
        msg.toLowerCase().includes("insufficient") ||
        msg.toLowerCase().includes("scope") ||
        msg.includes("403")
      ) {
        throw new UnauthorizedException(
          "Google Calendar permission missing. Reconnect Google and grant Calendar access.",
        );
      }
      if (
        msg.toLowerCase().includes("invalid credentials") ||
        msg.includes("401")
      ) {
        throw new UnauthorizedException(
          "Google session expired. Please reconnect your Google account.",
        );
      }
      throw new BadRequestException(`Calendar event creation failed: ${msg}`);
    }
    const meetLink =
      created.hangoutLink ||
      created.conferenceData?.entryPoints?.find(
        (p: { entryPointType?: string; uri?: string }) =>
          p.entryPointType === "video",
      )?.uri ||
      null;

    const updatedAction = await (this.prisma as any).briefAction.update({
      where: { id: action.id },
      data: {
        status: "COMPLETED",
        googleEventId: created.id || null,
        googleEventUrl: created.htmlLink || null,
        meetLink,
        completedAt: new Date(),
        errorMessage: null,
      },
      select: {
        id: true,
        sourceId: true,
        status: true,
      },
    });

    return {
      event: {
        id: created.id,
        htmlLink: created.htmlLink,
        meetLink,
        startsAt: created.start,
        endsAt: created.end,
      },
      action: updatedAction,
    };
  }

  async getBriefActionHistory(userId: string, briefId: string) {
    const brief = await this.prisma.dailyBrief.findFirst({
      where: { id: briefId, userId },
      select: { id: true },
    });

    if (!brief) {
      return null;
    }

    const actions = await (this.prisma as any).briefAction.findMany({
      where: { briefId, userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        sourceId: true,
        title: true,
        status: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
        completedAt: true,
      },
    });

    return actions;
  }

  /**
   * Delete brief by ID
   */
  async deleteBrief(briefId: string, userId: string) {
    return this.prisma.dailyBrief.deleteMany({
      where: {
        id: briefId,
        userId, // Ensure user owns the brief
      },
    });
  }

  /**
   * Update brief status
   */
  async updateStatus(briefId: string, status: BriefStatus, error?: string) {
    return this.prisma.dailyBrief.update({
      where: { id: briefId },
      data: {
        status,
        errorMessage: error,
      },
    });
  }

  /**
   * Get user's briefs
   */
  async getUserBriefs(userId: string, limit = 7) {
    const briefs = await this.prisma.dailyBrief.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: limit,
      select: {
        id: true,
        userId: true,
        date: true,
        scheduleId: true,
        textSummary: true,
        audioUrl: true,
        audioDuration: true,
        emailsProcessed: true,
        categoryCounts: true,
        status: true,
        processingTime: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
        summarySchedule: {
          select: {
            name: true,
            deliveryTime: true,
            timezone: true,
            voicePersona: true,
            customPrompt: true,
          },
        },
        // Omit the heavy scriptJson field from list view
      },
    });

    return Promise.all(briefs.map((brief: any) => this.signAudioUrl(brief)));
  }

  async getUserBriefStats(userId: string) {
    const briefs = await this.prisma.dailyBrief.findMany({
      where: { userId },
      select: {
        date: true,
        emailsProcessed: true,
        audioDuration: true,
        status: true,
        categoryCounts: true,
      },
      orderBy: { date: "asc" },
    });

    const totalBriefs = briefs.length;
    const deliveredBriefs = briefs.filter(
      (b) => b.status === "DELIVERED",
    ).length;
    const totalEmails = briefs.reduce(
      (sum, b) => sum + (b.emailsProcessed || 0),
      0,
    );
    const totalAudioSeconds = briefs.reduce(
      (sum, b) => sum + (b.audioDuration || 0),
      0,
    );

    const byDay: Record<string, number> = {};
    const categories: Record<string, number> = {};

    for (const brief of briefs) {
      const day = brief.date.toISOString().slice(0, 10);
      byDay[day] = (byDay[day] || 0) + (brief.emailsProcessed || 0);

      const catObj = (brief.categoryCounts || {}) as Record<string, number>;
      for (const [key, value] of Object.entries(catObj)) {
        categories[key] = (categories[key] || 0) + (Number(value) || 0);
      }
    }

    return {
      totalBriefs,
      deliveredBriefs,
      successRate:
        totalBriefs > 0 ? Math.round((deliveredBriefs / totalBriefs) * 100) : 0,
      totalEmails,
      estimatedMinutesSaved: totalEmails * 2,
      averageAudioDurationSec:
        deliveredBriefs > 0
          ? Math.round(totalAudioSeconds / deliveredBriefs)
          : 0,
      emailsByDay: byDay,
      categoryTotals: categories,
    };
  }

  /**
   * Get brief by ID, checking ownership
   */
  async getBrief(userId: string, briefId: string) {
    const brief = await (this.prisma.dailyBrief as any).findFirst({
      where: { id: briefId, userId },
      include: {
        actions: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            sourceId: true,
            status: true,
            googleEventId: true,
            googleEventUrl: true,
            meetLink: true,
            errorMessage: true,
            completedAt: true,
            updatedAt: true,
          },
        },
        summarySchedule: {
          select: {
            name: true,
            deliveryTime: true,
            timezone: true,
            voicePersona: true,
            customPrompt: true,
          },
        },
      },
    });

    if (!brief) {
      return null;
    }

    return this.signAudioUrl(brief);
  }

  private buildActionSourceId(
    payload: {
      sourceId?: string;
      title: string;
    },
    startDate: Date,
  ) {
    const provided = (payload.sourceId || "").trim();
    if (provided) return provided;

    return `${payload.title.trim().toLowerCase().replace(/\s+/g, "-")}|${startDate.toISOString()}`;
  }

  /**
   * Generate a presigned URL for the audio key if necessary
   */
  private async signAudioUrl<T extends { id: string; audioUrl: string | null }>(
    brief: T,
  ): Promise<T> {
    // If audioUrl is a key (not a URL and not a mock path), generate presigned URL
    if (
      brief.audioUrl &&
      !brief.audioUrl.startsWith("http") &&
      !brief.audioUrl.startsWith("/")
    ) {
      try {
        const signedUrl = await this.audioService.getPresignedUrl(
          brief.audioUrl,
        );
        return { ...brief, audioUrl: signedUrl };
      } catch (error) {
        this.logger.warn(
          `Failed to sign audio URL for brief ${brief.id}: ${error}`,
        );
        // Return original brief with key if signing fails
      }
    }
    return brief;
  }

  /**
   * Helper to construct the where clause for schedule queries
   */
  private getScheduleWhereClause(
    time: string,
    gmailConnected: boolean,
    timezone?: string,
  ) {
    return {
      isActive: true,
      deliveryTime: time,
      ...(timezone && { timezone }),
      user: {
        isActive: true,
        gmailConnected,
      },
    };
  }

  /**
   * Get all active users for scheduled processing
   * Now reads from SummarySchedule since delivery times are per-summary
   */
  async getActiveUsersForTime(time: string): Promise<string[]> {
    const schedules = await this.prisma.summarySchedule.findMany({
      where: this.getScheduleWhereClause(time, true),
      select: { userId: true },
      distinct: ["userId"],
    });
    return schedules.map((s: any) => s.userId);
  }

  /**
   * Get users with schedules but no Gmail connection
   */
  async getUsersWithoutGmail(
    time: string,
  ): Promise<{ userId: string; email: string }[]> {
    const schedules = await this.prisma.summarySchedule.findMany({
      where: this.getScheduleWhereClause(time, false),
      select: {
        userId: true,
        user: {
          select: {
            email: true,
          },
        },
      },
      distinct: ["userId"],
    });
    return schedules.map((s: any) => ({
      userId: s.userId,
      email: s.user.email,
    }));
  }

  /**
   * Get unique delivery configurations (timezone + time)
   */
  async getDeliveryConfigs() {
    return this.prisma.summarySchedule.findMany({
      where: { isActive: true },
      select: {
        timezone: true,
        deliveryTime: true,
      },
      distinct: ["timezone", "deliveryTime"],
    });
  }

  /**
   * Queue briefs for a specific timezone and time
   */
  async queueBriefsForTimezone(
    timezone: string,
    deliveryTime: string,
  ): Promise<number> {
    // Get schedules with full metadata
    const schedules = await this.prisma.summarySchedule.findMany({
      where: this.getScheduleWhereClause(deliveryTime, true, timezone),
      select: {
        id: true,
        userId: true,
        voicePersona: true,
        customPrompt: true,
      },
    });

    await Promise.all(
      schedules.map((schedule: any) =>
        this.queueBriefGeneration(schedule.userId, schedule.id, {
          voicePersona: schedule.voicePersona,
          customPrompt: schedule.customPrompt || undefined,
        }),
      ),
    );

    if (schedules.length > 0) {
      this.logger.log(
        `Queued ${schedules.length} briefs for ${timezone} at ${deliveryTime}`,
      );
    }
    return schedules.length;
  }
}
