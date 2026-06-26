import { Process, Processor } from "@nestjs/bull";
import { Logger } from "@nestjs/common";
import * as Sentry from "@sentry/nestjs";
import { Job } from "bull";
import moment from "moment-timezone";
import {
  Prisma,
  BriefStatus,
  VoicePersona,
  SenderPriority,
  SenderPreference,
} from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { IntegrationsService } from "../integrations/integrations.service";
import { AiService, ProcessedEmail } from "../ai/ai.service";
import { AudioService } from "../audio/audio.service";
import { DeliveryService } from "../delivery/delivery.service";
import { NotificationsService } from "../notifications/notifications.service";
import { EmbeddingService } from "../ai/embedding.service";

interface BriefJobData {
  briefId: string;
  userId: string;
  scheduleId?: string;
  scheduleMetadata?: { voicePersona?: string; customPrompt?: string };
}

@Processor("brief")
export class BriefProcessor {
  private readonly logger = new Logger(BriefProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly integrationsService: IntegrationsService,
    private readonly aiService: AiService,
    private readonly audioService: AudioService,
    private readonly deliveryService: DeliveryService,
    private readonly notificationsService: NotificationsService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  @Process("generate")
  async processBrief(job: Job<BriefJobData>) {
    const { briefId, userId, scheduleId, scheduleMetadata } = job.data;
    const startTime = Date.now();

    this.logger.log(`Processing brief ${briefId} for user ${userId}`);

    try {
      // Fetch user and schedule in parallel to reduce round trips
      const [user, schedule, senderPreferences] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, email: true },
        }),
        scheduleId
          ? this.prisma.summarySchedule.findUnique({
              where: { id: scheduleId },
              select: {
                emailsFrom: true,
                timezone: true,
                voicePersona: true,
                customPrompt: true,
                includeGmail: true,
                includeOutlook: true,
              },
            })
          : Promise.resolve(null),
        this.prisma.senderPreference.findMany({
          where: { userId },
        }),
      ]);

      if (!user) throw new Error("User not found");

      // Determine time range based on schedule
      let sinceTimestamp: number | undefined;

      if (schedule) {
        if (schedule.emailsFrom === "last_delivery") {
          const lastBrief = await this.prisma.dailyBrief.findFirst({
            where: {
              userId,
              scheduleId,
              status: "DELIVERED",
              id: { not: briefId },
            },
            orderBy: { createdAt: "desc" },
            select: { createdAt: true },
          });
          if (lastBrief) {
            sinceTimestamp = Math.floor(lastBrief.createdAt.getTime() / 1000);
          }
        } else if (schedule.emailsFrom === "since_midnight") {
          const today = moment().tz(schedule.timezone).startOf("day");
          sinceTimestamp = today.unix();
        } else if (schedule.emailsFrom === "last_24h") {
          sinceTimestamp = Math.floor(
            (Date.now() - 24 * 60 * 60 * 1000) / 1000,
          );
        } else if (schedule.emailsFrom === "last_12h") {
          sinceTimestamp = Math.floor(
            (Date.now() - 12 * 60 * 60 * 1000) / 1000,
          );
        } else if (schedule.emailsFrom === "last_6h") {
          sinceTimestamp = Math.floor((Date.now() - 6 * 60 * 60 * 1000) / 1000);
        }
      }

      // 1. Fetch emails
      await this.updateStatus(briefId, "FETCHING");
      const rawEmails = await this.integrationsService.fetchRecentItemsFromAll(
        userId,
        sinceTimestamp,
        schedule
          ? {
              includeGmail: schedule.includeGmail,
              includeOutlook: schedule.includeOutlook,
            }
          : undefined,
      );
      this.logger.log(`Fetched ${rawEmails.length} emails`);

      const prefMap = new Map<string, SenderPreference>();
      for (const pref of senderPreferences) {
        prefMap.set(pref.senderEmail.toLowerCase().trim(), pref);
      }

      const eligibleEmails = rawEmails.filter((email) => {
        const pref = prefMap.get(email.fromEmail.toLowerCase().trim());
        return !pref?.neverInclude;
      });

      this.logger.log(
        `Eligible emails after sender preferences: ${eligibleEmails.length}/${rawEmails.length}`,
      );

      if (eligibleEmails.length === 0) {
        await this.completeWithNoEmails(briefId);
        return;
      }

      // 2. Process with AI (map-reduce: one call per email)
      await this.updateStatus(briefId, "PROCESSING");
      const analyzedEmails = await this.aiService.analyzeEmails(eligibleEmails);
      const processedEmails = this.applySenderPreferencePriority(
        analyzedEmails,
        prefMap,
      );

      // Store embeddings + retrieve historical context in parallel
      const [, historicalContext] = await Promise.all([
        this.embeddingService.storeEmailEmbeddings(userId, briefId, processedEmails),
        this.embeddingService.getHistoricalContext(userId),
      ]);

      // Use queue metadata first, then schedule settings, then fallback to NEWSROOM
      const voicePersona: VoicePersona =
        (scheduleMetadata?.voicePersona as VoicePersona | undefined) ??
        (schedule?.voicePersona as VoicePersona | undefined) ??
        VoicePersona.NEWSROOM;
      const customPrompt =
        scheduleMetadata?.customPrompt ?? schedule?.customPrompt ?? undefined;

      // Generate script with historical memory injected
      const script = await this.aiService.generateScript(
        processedEmails,
        voicePersona,
        user.name || undefined,
        customPrompt,
        historicalContext,
      );

      // 3. Generate audio
      await this.updateStatus(briefId, "GENERATING_AUDIO");
      const { audioKey, duration } = await this.audioService.generateAudio(
        script,
        voicePersona,
        briefId,
      );

      // 4. Save brief — use AI-powered text summary with historical context
      const textSummary =
        await this.aiService.generateTextSummary(processedEmails, historicalContext);
      const categoryCounts = this.getCategoryCounts(processedEmails);

      // Extract and upsert Action Items
      const actionItemPromises = [];
      for (const email of processedEmails) {
        if (!email.analysis.actionItems || email.analysis.actionItems.length === 0) {
          continue;
        }

        for (const action of email.analysis.actionItems) {
          const startsAt = action.startsAt ? new Date(action.startsAt) : null;
          const endsAt = action.endsAt ? new Date(action.endsAt) : null;

          actionItemPromises.push(
            this.prisma.actionItem.upsert({
              where: {
                userId_sourceId_type: {
                  userId,
                  sourceId: email.id,
                  type: action.type,
                },
              },
              create: {
                userId,
                briefId,
                type: action.type,
                title: action.title,
                description: action.description || null,
                links: action.links || [],
                priority: action.priority ?? 50,
                status: "PENDING",
                sourceType: email.id.startsWith("outlook-") ? "outlook" : "email",
                sourceId: email.id,
                sourceSubject: email.subject,
                sourceSender: email.from,
                sourcePreview: email.snippet,
                startsAt,
                endsAt,
                allDay: !!action.allDay,
                participants: action.participants || [],
                location: action.location || null,
                replyIndicator: !!action.replyIndicator,
              },
              update: {
                briefId,
                title: action.title,
                description: action.description || null,
                links: action.links || [],
                priority: action.priority ?? 50,
                startsAt,
                endsAt,
                allDay: !!action.allDay,
                participants: action.participants || [],
                location: action.location || null,
                replyIndicator: !!action.replyIndicator,
              },
            })
          );
        }
      }
      await Promise.all(actionItemPromises);

      await this.prisma.dailyBrief.update({
        where: { id: briefId },
        data: {
          textSummary,
          scriptJson: script as unknown as Prisma.JsonArray,
          audioUrl: audioKey, // Store the S3 key (or mock path) in the audioUrl field
          audioDuration: duration,
          emailsProcessed: eligibleEmails.length,
          categoryCounts,
          status: "DELIVERING",
          processingTime: Date.now() - startTime,
        },
      });

      // 5. Deliver
      const deliverBrief = await this.prisma.dailyBrief.findUnique({
        where: { id: briefId },
      });

      if (deliverBrief) {
        await this.deliveryService.sendBriefEmail(user, deliverBrief);
      }

      await this.updateStatus(briefId, "DELIVERED");

      const subscription = await this.notificationsService.getSubscription(userId);
      if (subscription) {
        await this.notificationsService.sendNotification(userId, {
          title: "Your Inbox FM Brief is Ready",
          body: "Your daily audio briefing is ready to listen.",
          data: {
            tag: "brief-ready",
            url: "/dashboard",
          },
        });
        this.logger.log(`Brief ready notification sent for user ${userId}`);
      }

      this.logger.log(
        `Brief ${briefId} completed in ${Date.now() - startTime}ms`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Brief ${briefId} failed: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );

      Sentry.captureException(error, {
        tags: { action: "brief_generation" },
        extra: { briefId, userId },
      });

      await this.updateStatus(briefId, "FAILED", message);

      // Fetch user if not already available (in case error happened before user fetch)
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      });

      if (user) {
        await this.deliveryService.sendBriefErrorEmail(user, message);
      }

      throw error;
    }
  }

  private async updateStatus(
    briefId: string,
    status: BriefStatus,
    error?: string,
  ) {
    return this.prisma.dailyBrief.update({
      where: { id: briefId },
      data: { status, errorMessage: error },
    });
  }

  private async completeWithNoEmails(briefId: string) {
    await this.prisma.dailyBrief.update({
      where: { id: briefId },
      data: {
        textSummary: "No calendar-relevant events found in the last 24 hours.",
        scriptJson: [],
        emailsProcessed: 0,
        status: "DELIVERED",
      },
    });
  }

  private generateTextSummary(emails: ProcessedEmail[]): string {
    const urgent = emails.filter(
      (e) =>
        e.analysis.category === "URGENT" ||
        e.analysis.category === "ACTION_REQUIRED",
    );
    const deadlines = emails.filter((e) => e.analysis.category === "DEADLINES");
    const total = emails.length;

    let summary = `You have ${total} new emails. `;

    if (urgent.length > 0) {
      summary += `${urgent.length} require your attention. `;
    }

    if (deadlines.length > 0) {
      summary += `${deadlines.length} mention deadlines. `;
    }

    // Add top 3 email summaries
    const top = emails.slice(0, 3);
    summary += "\n\nTop emails:\n";
    top.forEach((e, i) => {
      summary += `${i + 1}. ${e.from.split("<")[0].trim()}: ${e.analysis.suggestedSummary}\n`;
    });

    return summary;
  }

  private getCategoryCounts(emails: ProcessedEmail[]): Record<string, number> {
    return emails.reduce(
      (acc, email) => {
        const cat = email.analysis.category;
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  private applySenderPreferencePriority(
    emails: ProcessedEmail[],
    prefMap: Map<string, SenderPreference>,
  ): ProcessedEmail[] {
    const priorityBoostBySetting: Record<SenderPriority, number> = {
      CRITICAL: 30,
      HIGH: 15,
      NORMAL: 0,
      LOW: -10,
      IGNORE: -25,
    };

    return emails
      .map((email) => {
        const pref = prefMap.get(email.fromEmail.toLowerCase().trim());
        if (!pref) return email;

        const boost = priorityBoostBySetting[pref.priority] ?? 0;
        let adjustedPriority = email.analysis.priority + boost;

        if (pref.alwaysInclude) {
          adjustedPriority = Math.max(adjustedPriority, 75);
        }

        adjustedPriority = Math.max(0, Math.min(100, adjustedPriority));

        return {
          ...email,
          analysis: {
            ...email.analysis,
            priority: adjustedPriority,
          },
        };
      })
      .sort((a, b) => b.analysis.priority - a.analysis.priority);
  }
}
