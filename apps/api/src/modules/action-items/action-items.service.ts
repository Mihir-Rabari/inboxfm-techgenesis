import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AiService } from "../ai/ai.service";
import { IntegrationsService } from "../integrations/integrations.service";
import { OutlookService } from "../integrations/outlook.service";
import { EncryptionUtil } from "../../utils/encryption.util";
import { ConfigService } from "@nestjs/config";
import { google } from "googleapis";
import {
  ActionItem,
  ActionItemType,
  ActionItemStatus,
  IntegrationProvider,
  IntegrationStatus,
} from "@prisma/client";

@Injectable()
export class ActionItemsService {
  private readonly logger = new Logger(ActionItemsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly integrationsService: IntegrationsService,
    private readonly outlookService: OutlookService,
    private readonly encryptionUtil: EncryptionUtil,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get filtered action items for a user
   */
  async getActionItems(
    userId: string,
    filters?: { status?: ActionItemStatus; type?: ActionItemType; briefId?: string; limit?: number },
  ): Promise<ActionItem[]> {
    return this.prisma.actionItem.findMany({
      where: {
        userId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.type && { type: filters.type }),
        ...(filters?.briefId && { briefId: filters.briefId }),
      },
      orderBy: { createdAt: "desc" },
      ...(filters?.limit && { take: filters.limit }),
    });
  }

  /**
   * Get counts of pending action items
   */
  async getCounts(userId: string) {
    const counts = await this.prisma.actionItem.groupBy({
      by: ["status"],
      where: { userId },
      _count: {
        _all: true,
      },
    });

    const result = {
      PENDING: 0,
      APPROVED: 0,
      IGNORED: 0,
      COMPLETED: 0,
      EDITED: 0,
      SNOOZED: 0,
    };

    for (const item of counts) {
      if (item.status in result) {
        result[item.status as ActionItemStatus] = item._count._all;
      }
    }

    return result;
  }

  /**
   * Get details of a single action item
   */
  async getActionItem(userId: string, id: string): Promise<ActionItem> {
    const item = await this.prisma.actionItem.findFirst({
      where: { id, userId },
    });

    if (!item) {
      throw new NotFoundException("Action item not found");
    }

    return item;
  }

  /**
   * Update status of an action item
   */
  async updateStatus(
    userId: string,
    id: string,
    status: ActionItemStatus,
  ): Promise<ActionItem> {
    const item = await this.getActionItem(userId, id);

    return this.prisma.actionItem.update({
      where: { id: item.id },
      data: { status },
    });
  }

  /**
   * Edit content of an action item
   */
  async updateActionItem(
    userId: string,
    id: string,
    data: Partial<ActionItem>,
  ): Promise<ActionItem> {
    const item = await this.getActionItem(userId, id);

    // Filter allowed fields for manual editing
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.startsAt !== undefined) updateData.startsAt = data.startsAt ? new Date(data.startsAt) : null;
    if (data.endsAt !== undefined) updateData.endsAt = data.endsAt ? new Date(data.endsAt) : null;
    if (data.allDay !== undefined) updateData.allDay = !!data.allDay;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.participants !== undefined) updateData.participants = data.participants;
    if (data.editedContent !== undefined) updateData.editedContent = data.editedContent;
    if (data.status !== undefined) updateData.status = data.status;
    if ((data as any).links !== undefined) updateData.links = (data as any).links;

    return this.prisma.actionItem.update({
      where: { id: item.id },
      data: updateData,
    });
  }

  /**
   * On-demand AI reply suggestion generation
   */
  async generateReply(
    userId: string,
    id: string,
    promptDraft?: string,
  ): Promise<{ suggestedReply: string }> {
    const item = await this.getActionItem(userId, id);

    if (item.type !== ActionItemType.REPLY && !item.replyIndicator) {
      throw new BadRequestException("This action item does not require a reply");
    }

    // Use sourcePreview or sourceSubject/sender to construct prompt context
    const sender = item.sourceSender || "Unknown Sender";
    const subject = item.sourceSubject || "No Subject";
    const body = item.sourcePreview || "No preview content available";

    const replyText = await this.aiService.generateReplySuggestion(
      sender,
      subject,
      body,
      promptDraft,
    );

    await this.prisma.actionItem.update({
      where: { id: item.id },
      data: { suggestedReply: replyText },
    });

    return { suggestedReply: replyText };
  }

  /**
   * Send mail reply via Outlook only
   */
  async sendMail(userId: string, id: string): Promise<{ success: boolean; sentMailId: string }> {
    const item = await this.getActionItem(userId, id);

    const replyContent = item.editedContent || item.suggestedReply;
    if (!replyContent) {
      throw new BadRequestException("No reply content found. Generate or edit a reply first.");
    }

    // Retrieve user's Outlook integration
    const integration = await this.prisma.userIntegration.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: IntegrationProvider.OUTLOOK,
        },
      },
    });

    if (!integration || integration.status !== IntegrationStatus.CONNECTED) {
      throw new BadRequestException({
        code: "PROVIDER_NOT_CONFIGURED",
        message: "Connect Outlook to send emails",
        action: "/integrations",
      });
    }

    // Refresh token if needed
    const validToken = await this.integrationsService.getOrRefreshOutlookToken(integration);
    
    // Parse sender/receiver from sourceSender (usually formatted as "Name <email@domain.com>")
    let recipientEmail = "";
    if (item.sourceSender) {
      const match = item.sourceSender.match(/<(.+?)>/);
      recipientEmail = match ? match[1] : item.sourceSender;
    }

    if (!recipientEmail || !recipientEmail.includes("@")) {
      throw new BadRequestException("Cannot determine recipient email from source sender.");
    }

    const subject = item.sourceSubject ? `Re: ${item.sourceSubject}` : "Reply from InboxFM";

    this.logger.log(`Sending Outlook email reply to ${recipientEmail}`);
    await this.outlookService.sendOutlookMail(
      validToken,
      recipientEmail,
      subject,
      replyContent,
    );

    const sentMailId = `outlook-sent-${Date.now()}`;
    await this.prisma.actionItem.update({
      where: { id: item.id },
      data: {
        status: ActionItemStatus.COMPLETED,
        sentMailId,
        sentAt: new Date(),
      },
    });

    return { success: true, sentMailId };
  }

  /**
   * Sync meeting event to Google Calendar
   */
  async calendarSync(userId: string, id: string) {
    const item = await this.getActionItem(userId, id);

    if (!item.startsAt) {
      throw new BadRequestException("Action item has no start time set");
    }

    // Retrieve user's Google Calendar integration
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
      throw new BadRequestException({
        code: "PROVIDER_NOT_CONFIGURED",
        message: "Connect Google Calendar first",
        action: "/integrations",
      });
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

    const startsAt = item.startsAt;
    const endsAt = item.endsAt || new Date(startsAt.getTime() + 30 * 60 * 1000);
    const isAllDay = !!item.allDay;

    let created: any;

    try {
      const eventRes = await calendar.events.insert({
        calendarId: "primary",
        conferenceDataVersion: item.includeMeet ? 1 : 0,
        requestBody: {
          summary: item.title,
          description: item.description || "",
          location: item.location || undefined,
          attendees: item.participants.map((email) => ({ email })),
          start: isAllDay
            ? { date: startsAt.toISOString().slice(0, 10) }
            : { dateTime: startsAt.toISOString() },
          end: isAllDay
            ? { date: endsAt.toISOString().slice(0, 10) }
            : { dateTime: endsAt.toISOString() },
          conferenceData: item.includeMeet
            ? {
                createRequest: {
                  requestId: `actionitem-${item.id}-${Date.now()}`,
                  conferenceSolutionKey: { type: "hangoutsMeet" },
                },
              }
            : undefined,
        },
        sendUpdates: item.participants.length > 0 ? "all" : "none",
      });
      created = eventRes.data;
    } catch (error: any) {
      const msg = String(error?.message || "Failed to create calendar event");
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

    await this.prisma.actionItem.update({
      where: { id: item.id },
      data: {
        status: ActionItemStatus.APPROVED,
        googleEventId: created.id || null,
        googleEventUrl: created.htmlLink || null,
        meetLink,
      },
    });

    return {
      success: true,
      event: {
        id: created.id,
        htmlLink: created.htmlLink,
        meetLink,
        startsAt: created.start,
        endsAt: created.end,
      },
    };
  }

  /**
   * Soft delete or regular delete an action item
   */
  async deleteActionItem(userId: string, id: string): Promise<{ success: boolean }> {
    const item = await this.getActionItem(userId, id);

    await this.prisma.actionItem.delete({
      where: { id: item.id },
    });

    return { success: true };
  }
}
