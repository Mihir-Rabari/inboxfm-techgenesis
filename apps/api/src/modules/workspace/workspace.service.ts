import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { IntegrationProvider, IntegrationStatus } from "@prisma/client";
import { google } from "googleapis";
import { IntegrationsService } from "../integrations/integrations.service";
import { EncryptionUtil } from "../../utils/encryption.util";
import { ConfigService } from "@nestjs/config";

export interface UnifiedCalendarEvent {
  id: string;
  title: string;
  description: string;
  startsAt: string | Date;
  endsAt: string | Date | null;
  location: string;
  meetLink: string;
  source: "google" | "outlook" | "action_item";
}

@Injectable()
export class WorkspaceService {
  private readonly logger = new Logger(WorkspaceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly integrationsService: IntegrationsService,
    private readonly encryptionUtil: EncryptionUtil,
    private readonly configService: ConfigService
  ) {}

  async getFeed(userId: string) {
    const items = await this.prisma.actionItem.findMany({
      where: {
        userId,
        status: {
          in: ["PENDING", "COMPLETED", "APPROVED"],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const tasks = items.filter((item) => item.type === "TASK" && item.status === "PENDING");
    const meetings = items.filter((item) => item.type === "MEETING" && item.status === "PENDING");
    const replies = items.filter((item) => item.type === "REPLY" && item.status === "PENDING");
    const followUps = items.filter((item) => item.type === "FOLLOW_UP" && item.status === "PENDING");
    
    // Sort activity feed by updatedAt desc
    const recentActivity = items
      .filter((item) => item.status !== "PENDING")
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 10);

    return {
      tasks,
      meetings,
      replies,
      followUps,
      recentActivity,
      counts: {
        tasks: tasks.length,
        meetings: meetings.length,
        replies: replies.length,
        followUps: followUps.length,
      },
    };
  }

  async getCalendar(userId: string): Promise<UnifiedCalendarEvent[]> {
    const events: UnifiedCalendarEvent[] = [];

    // 1. Fetch Google Calendar events if connected
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (user && user.gmailConnected && user.accessToken) {
        const accessToken = this.encryptionUtil.decrypt(user.accessToken);
        const refreshToken = user.refreshToken ? this.encryptionUtil.decrypt(user.refreshToken) : undefined;

        const oauth2Client = new google.auth.OAuth2(
          this.configService.get("GOOGLE_CLIENT_ID"),
          this.configService.get("GOOGLE_CLIENT_SECRET")
        );

        oauth2Client.setCredentials({
          access_token: accessToken,
          refresh_token: refreshToken,
          expiry_date: user.tokenExpiry ? user.tokenExpiry.getTime() : undefined,
        });

        const calendar = google.calendar({ version: "v3", auth: oauth2Client });
        const timeMin = new Date().toISOString();
        const timeMax = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

        const listResponse = await calendar.events.list({
          calendarId: "primary",
          timeMin,
          timeMax,
          singleEvents: true,
          orderBy: "startTime",
          maxResults: 30,
        });

        const googleEvents = listResponse.data.items || [];
        googleEvents.forEach((ev) => {
          const startVal = ev.start?.dateTime || ev.start?.date;
          const endVal = ev.end?.dateTime || ev.end?.date;
          if (startVal) {
            events.push({
              id: `google-cal-${ev.id}`,
              title: ev.summary || "(No Title)",
              description: ev.description || "",
              startsAt: new Date(startVal),
              endsAt: endVal ? new Date(endVal) : null,
              location: ev.location || "",
              meetLink: ev.hangoutLink || "",
              source: "google",
            });
          }
        });
      }
    } catch (err: any) {
      this.logger.error(`Workspace Google Calendar fetch failed: ${err.message}`);
    }

    // 2. Fetch Outlook Calendar events if connected
    try {
      const conn = await this.prisma.userIntegration.findUnique({
        where: {
          userId_provider: {
            userId,
            provider: IntegrationProvider.OUTLOOK,
          },
        },
      });

      if (conn && conn.status === IntegrationStatus.CONNECTED) {
        const accessToken = await this.integrationsService.getOrRefreshOutlookToken(conn);
        if (accessToken) {
          const endDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
          const url = `https://graph.microsoft.com/v1.0/me/calendarview?startDateTime=${new Date().toISOString()}&endDateTime=${endDate.toISOString()}&$select=id,subject,bodyPreview,start,end,location,onlineMeeting&$top=30`;
          
          const res = await fetch(url, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/json",
            },
          });

          if (res.ok) {
            const data = await res.json() as any;
            const outlookEvents = data.value || [];
            outlookEvents.forEach((ev: any) => {
              if (ev.start?.dateTime) {
                events.push({
                  id: `outlook-cal-${ev.id}`,
                  title: ev.subject || "(No Title)",
                  description: ev.bodyPreview || "",
                  startsAt: new Date(ev.start.dateTime),
                  endsAt: ev.end?.dateTime ? new Date(ev.end.dateTime) : null,
                  location: ev.location?.displayName || "",
                  meetLink: ev.onlineMeeting?.joinUrl || "",
                  source: "outlook",
                });
              }
            });
          }
        }
      }
    } catch (err: any) {
      this.logger.error(`Workspace Outlook Calendar fetch failed: ${err.message}`);
    }

    // 3. Fetch Action Items type MEETING from Database (as fallback/supplement)
    try {
      const actionItems = await this.prisma.actionItem.findMany({
        where: {
          userId,
          type: "MEETING",
          status: "PENDING",
        },
      });

      actionItems.forEach((item) => {
        if (item.startsAt) {
          // Deduplicate if we already got it from Google/Outlook (matching by title and start date proximity)
          const isDuplicate = events.some((ev) => {
            const titleMatch = ev.title.toLowerCase().trim() === item.title.toLowerCase().trim();
            const startProximity = Math.abs(new Date(ev.startsAt).getTime() - new Date(item.startsAt!).getTime()) < 5 * 60 * 1000;
            return titleMatch && startProximity;
          });

          if (!isDuplicate) {
            events.push({
              id: `action-item-${item.id}`,
              title: item.title,
              description: item.description || "",
              startsAt: item.startsAt,
              endsAt: item.endsAt,
              location: item.location || "",
              meetLink: item.meetLink || "",
              source: "action_item",
            });
          }
        }
      });
    } catch (err: any) {
      this.logger.error(`Workspace DB calendar items fetch failed: ${err.message}`);
    }

    // Sort all events chronologically
    return events.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }
}
