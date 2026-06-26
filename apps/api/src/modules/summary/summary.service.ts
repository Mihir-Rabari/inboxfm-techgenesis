import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { VoicePersona } from "@prisma/client";
import { CreateSummaryDto, UpdateSummaryDto } from "./summary.dto";
import {
  DEFAULT_SUMMARY_NAME,
  DEFAULT_DELIVERY_TIME,
  DEFAULT_TIMEZONE,
  DEFAULT_VOICE_PERSONA,
  DEFAULT_EMAILS_FROM,
  TIME_FORMAT_REGEX,
} from "./summary.constants";

@Injectable()
export class SummaryService {
  private readonly logger = new Logger(SummaryService.name);
  constructor(private readonly prisma: PrismaService) {}

  async createDefaultSummary(userId: string) {
    // Check if user already has a default summary
    const existing = await this.prisma.summarySchedule.findFirst({
      where: { userId, name: DEFAULT_SUMMARY_NAME },
    });

    if (existing) {
      return existing;
    }

    // Create default morning summary
    return this.prisma.summarySchedule.create({
      data: {
        userId,
        name: DEFAULT_SUMMARY_NAME,
        deliveryTime: DEFAULT_DELIVERY_TIME,
        timezone: DEFAULT_TIMEZONE,
        voicePersona: DEFAULT_VOICE_PERSONA,
        emailsFrom: DEFAULT_EMAILS_FROM,
        isActive: true,
      },
    });
  }

  async getUserSchedules(userId: string) {
    this.logger.log(`Fetching schedules for user: ${userId}`);
    try {
      return await this.prisma.summarySchedule.findMany({
        where: { userId },
        include: { style: true },
        orderBy: { deliveryTime: "asc" },
      });
    } catch (err) {
      this.logger.error(`Failed to fetch schedules: ${err.message}`);
      throw err;
    }
  }

  async getSummaryById(id: string, userId: string) {
    const summary = await this.prisma.summarySchedule.findFirst({
      where: { id, userId },
      include: { style: true },
    });

    if (!summary) {
      throw new NotFoundException("Summary schedule not found");
    }

    return summary;
  }

  async createSummary(userId: string, data: CreateSummaryDto) {
    // Validate time format
    if (data.deliveryTime) {
      this.validateTimeFormat(data.deliveryTime);
    }

    // Check for duplicates
    const existingCount = await this.prisma.summarySchedule.count({
      where: {
        userId,
        name: data.name,
      },
    });

    if (existingCount > 0) {
      throw new BadRequestException(
        `A summary with the name "${data.name}" already exists`,
      );
    }

    const normalizedCustomPrompt = data.customPrompt?.trim() || null;

    return this.prisma.summarySchedule.create({
      data: {
        userId,
        name: data.name,
        deliveryTime: data.deliveryTime,
        timezone: data.timezone || DEFAULT_TIMEZONE,
        voicePersona:
          (data.voicePersona as VoicePersona) || DEFAULT_VOICE_PERSONA,
        emailsFrom: data.emailsFrom || DEFAULT_EMAILS_FROM,
        includeGmail: data.includeGmail !== undefined ? data.includeGmail : true,
        includeOutlook: data.includeOutlook !== undefined ? data.includeOutlook : true,
        customPrompt: normalizedCustomPrompt,
        styleId: data.styleId || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
      include: { style: true },
    });
  }

  async updateSummary(id: string, userId: string, data: UpdateSummaryDto) {
    await this.getSummaryById(id, userId); // Verify ownership

    // Validate time format if updating
    if (data.deliveryTime) {
      this.validateTimeFormat(data.deliveryTime);
    }

    const normalizedCustomPrompt =
      data.customPrompt !== undefined
        ? data.customPrompt.trim() || null
        : undefined;

    return this.prisma.summarySchedule.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.deliveryTime && { deliveryTime: data.deliveryTime }),
        ...(data.timezone && { timezone: data.timezone }),
        ...(data.voicePersona && {
          voicePersona: data.voicePersona as VoicePersona,
        }),
        ...(data.emailsFrom && { emailsFrom: data.emailsFrom }),
        ...(data.includeGmail !== undefined && { includeGmail: data.includeGmail }),
        ...(data.includeOutlook !== undefined && { includeOutlook: data.includeOutlook }),
        ...(normalizedCustomPrompt !== undefined && {
          customPrompt: normalizedCustomPrompt,
        }),
        ...(data.styleId !== undefined && { styleId: data.styleId }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: { style: true },
    });
  }

  private validateTimeFormat(time: string) {
    if (!TIME_FORMAT_REGEX.test(time)) {
      throw new BadRequestException(
        `Invalid time format. Use HH:MM (e.g., ${DEFAULT_DELIVERY_TIME})`,
      );
    }
  }

  async deleteSummary(id: string, userId: string) {
    await this.getSummaryById(id, userId); // Verify ownership

    return this.prisma.summarySchedule.delete({
      where: { id },
    });
  }

  async toggleSummary(id: string, userId: string) {
    const summary = await this.getSummaryById(id, userId);

    return this.prisma.summarySchedule.update({
      where: { id },
      data: { isActive: !summary.isActive },
    });
  }

  async getActiveSchedulesForDelivery() {
    return this.prisma.summarySchedule.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            gmailConnected: true,
            accessToken: true,
            refreshToken: true,
          },
        },
      },
    });
  }
}
