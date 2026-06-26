import { Injectable, Logger } from '@nestjs/common';
import { RawEmail } from '../gmail/gmail.service';

@Injectable()
export class OutlookService {
  private readonly logger = new Logger(OutlookService.name);

  /**
   * Fetch recent emails and upcoming calendar events from Outlook
   */
  async fetchRecentItems(
    accessToken: string,
    sinceTimestamp?: number,
  ): Promise<RawEmail[]> {
    const sinceDate = sinceTimestamp
      ? new Date(sinceTimestamp * 1000)
      : new Date(Date.now() - 24 * 60 * 60 * 1000);

    this.logger.log(`Fetching Outlook items since ${sinceDate.toISOString()}`);



    try {
      const results: RawEmail[] = [];

      // 1. Fetch Outlook Mail via Microsoft Graph
      const mailPromise = this.fetchOutlookMail(accessToken, sinceDate)
        .then((emails) => results.push(...emails))
        .catch((err) => {
          this.logger.error(`Failed to fetch Outlook Mail via API: ${err.message}`);
          throw err;
        });

      // 2. Fetch Outlook Calendar Events via Microsoft Graph
      const calendarPromise = this.fetchOutlookCalendar(accessToken, sinceDate)
        .then((events) => results.push(...events))
        .catch((err) => {
          this.logger.error(`Failed to fetch Outlook Calendar via API: ${err.message}`);
          throw err;
        });

      await Promise.all([mailPromise, calendarPromise]);
      return results;
    } catch (error) {
      this.logger.error(`Error in Outlook fetching orchestration: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actual Microsoft Graph API call to fetch mail
   */
  private async fetchOutlookMail(
    accessToken: string,
    sinceDate: Date,
  ): Promise<RawEmail[]> {
    const url = `https://graph.microsoft.com/v1.0/me/messages?$filter=receivedDateTime ge ${sinceDate.toISOString()}&$select=id,conversationId,subject,bodyPreview,body,from,receivedDateTime&$top=50`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Graph API returned ${res.status}: ${res.statusText}`);
    }

    const data = await res.json() as any;
    const messages = data.value || [];

    return messages.map((msg: any) => {
      const fromName = msg.from?.emailAddress?.name || 'Unknown Outlook Sender';
      const fromAddr = msg.from?.emailAddress?.address?.toLowerCase().trim() || 'outlook@microsoft.com';
      const receivedAt = msg.receivedDateTime ? new Date(msg.receivedDateTime) : new Date();

      return {
        id: `outlook-mail-${msg.id}`,
        threadId: msg.conversationId || msg.id,
        from: `${fromName} <${fromAddr}>`,
        fromEmail: fromAddr,
        subject: msg.subject || '(No Subject)',
        snippet: msg.bodyPreview || '',
        body: msg.body?.content || msg.bodyPreview || '',
        receivedAt,
      };
    });
  }

  /**
   * Actual Microsoft Graph API call to fetch calendar events
   */
  private async fetchOutlookCalendar(
    accessToken: string,
    sinceDate: Date,
  ): Promise<RawEmail[]> {
    // Check next 48 hours for upcoming calendar events
    const endDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const url = `https://graph.microsoft.com/v1.0/me/calendarview?startDateTime=${sinceDate.toISOString()}&endDateTime=${endDate.toISOString()}&$select=id,subject,bodyPreview,start,end,location,organizer&$top=30`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Graph API returned ${res.status}: ${res.statusText}`);
    }

    const data = await res.json() as any;
    const events = data.value || [];

    return events.map((event: any) => {
      const organizerName = event.organizer?.emailAddress?.name || 'Organizer';
      const organizerAddr = event.organizer?.emailAddress?.address?.toLowerCase().trim() || 'calendar@outlook.com';
      const startsAt = event.start?.dateTime ? new Date(event.start.dateTime) : new Date();
      const endsAt = event.end?.dateTime ? new Date(event.end.dateTime) : null;
      const location = event.location?.displayName || 'Virtual / Microsoft Teams';

      return {
        id: `outlook-cal-${event.id}`,
        threadId: event.id,
        from: `${organizerName} <${organizerAddr}>`,
        fromEmail: organizerAddr,
        subject: `[Outlook Calendar] ${event.subject}`,
        snippet: `Meeting invite: ${event.subject} on ${startsAt.toLocaleString()}`,
        body: `Calendar Event Details:
Title: ${event.subject}
Organized by: ${organizerName}
Start: ${startsAt.toLocaleString()}
End: ${endsAt ? endsAt.toLocaleString() : 'N/A'}
Location: ${location}

Details: ${event.bodyPreview || 'No description provided.'}`,
        receivedAt: startsAt,
      };
    });
  }

  async sendOutlookMail(
    accessToken: string,
    to: string,
    subject: string,
    content: string,
  ): Promise<string> {
    const url = 'https://graph.microsoft.com/v1.0/me/sendMail';
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          subject,
          body: {
            contentType: 'Text',
            content,
          },
          toRecipients: [
            {
              emailAddress: {
                address: to,
              },
            },
          ],
        },
        saveToSentItems: 'true',
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Graph API sendMail returned ${res.status}: ${res.statusText}. Details: ${errText}`);
    }

    return 'success';
  }
}
