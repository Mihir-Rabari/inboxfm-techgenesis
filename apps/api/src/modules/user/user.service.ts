import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { SenderPriority } from "@prisma/client";
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsEmail,
  IsEnum,
  IsInt,
} from "class-validator";

export class UpdatePreferencesDto {
  @IsString()
  @IsOptional()
  timezone?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  onboardingComplete?: boolean;

  @IsInt()
  @IsOptional()
  onboardingStep?: number;
}

export class UpsertSenderPreferenceDto {
  @IsEmail()
  senderEmail: string;

  @IsOptional()
  @IsString()
  senderName?: string;

  @IsOptional()
  @IsEnum(SenderPriority)
  priority?: SenderPriority;

  @IsOptional()
  @IsBoolean()
  alwaysInclude?: boolean;

  @IsOptional()
  @IsBoolean()
  neverInclude?: boolean;
}

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async updatePreferences(userId: string, data: UpdatePreferencesDto) {
    // Explicitly extract fields to prevent mass assignment
    const { timezone, isActive, onboardingComplete, onboardingStep } = data;

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        timezone,
        isActive,
        onboardingComplete,
        onboardingStep,
      },
    });
  }

  async getSenderPreferences(userId: string) {
    return this.prisma.senderPreference.findMany({
      where: { userId },
      orderBy: [{ priority: "desc" }, { senderEmail: "asc" }],
    });
  }

  async upsertSenderPreference(
    userId: string,
    data: UpsertSenderPreferenceDto,
  ) {
    const senderEmail = data.senderEmail.toLowerCase().trim();
    const senderName = data.senderName?.trim() || null;
    const alwaysInclude = !!data.alwaysInclude;
    const neverInclude = !!data.neverInclude;

    if (alwaysInclude && neverInclude) {
      throw new BadRequestException(
        "A sender cannot be both alwaysInclude and neverInclude.",
      );
    }

    return this.prisma.senderPreference.upsert({
      where: {
        userId_senderEmail: {
          userId,
          senderEmail,
        },
      },
      create: {
        userId,
        senderEmail,
        senderName,
        priority: data.priority || SenderPriority.NORMAL,
        alwaysInclude,
        neverInclude,
        lastSeenAt: new Date(),
      },
      update: {
        senderName,
        priority: data.priority || SenderPriority.NORMAL,
        alwaysInclude,
        neverInclude,
        lastSeenAt: new Date(),
      },
    });
  }

  async deleteSenderPreference(userId: string, encodedSenderEmail: string) {
    const senderEmail = decodeURIComponent(encodedSenderEmail)
      .toLowerCase()
      .trim();

    await this.prisma.senderPreference.deleteMany({
      where: { userId, senderEmail },
    });

    return { success: true };
  }

  async getUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        picture: true,
        gmailConnected: true,
        timezone: true,
        isActive: true,
        onboardingComplete: true,
        onboardingStep: true,
        createdAt: true,
      },
    });
  }

  async getUserWithBriefs(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        dailyBriefs: {
          orderBy: { date: "desc" },
          take: 7,
        },
      },
    });
  }

  async deactivateUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
  }
}
