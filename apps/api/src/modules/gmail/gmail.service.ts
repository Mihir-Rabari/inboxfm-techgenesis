import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, gmail_v1 } from 'googleapis';

import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionUtil } from '../../utils/encryption.util';
import pLimit from 'p-limit';

const DEFAULT_EMAIL_FETCH_LIMIT = 200;

export interface RawEmail {
    id: string;
    threadId: string;
    from: string;
    fromEmail: string;
    subject: string;
    snippet: string;
    body: string;
    receivedAt: Date;
}

@Injectable()
export class GmailService {
    private readonly logger = new Logger(GmailService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly encryptionUtil: EncryptionUtil,
        private readonly configService: ConfigService,
    ) { }

    /**
     * Create Gmail client with user's OAuth tokens, proactively refreshing if needed
     */
    private async createGmailClient(accessToken: string, refreshToken?: string, userId?: string, tokenExpiry?: Date | null): Promise<gmail_v1.Gmail> {
        const clientId = this.configService.get('GOOGLE_CLIENT_ID');
        const clientSecret = this.configService.get('GOOGLE_CLIENT_SECRET');
        const auth = new google.auth.OAuth2(clientId, clientSecret);

        auth.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken,
            expiry_date: tokenExpiry ? tokenExpiry.getTime() : undefined,
        });

        // Persist any newly refreshed tokens automatically
        if (userId) {
            auth.on('tokens', async (tokens) => {
                if (tokens.access_token) {
                    this.logger.log(`Persisting refreshed tokens for user ${userId}`);
                    try {
                        await this.prisma.user.update({
                            where: { id: userId },
                            data: {
                                accessToken: this.encryptionUtil.encrypt(tokens.access_token),
                                // Only overwrite refresh token if Google gave us a new one
                                ...(tokens.refresh_token && {
                                    refreshToken: this.encryptionUtil.encrypt(tokens.refresh_token),
                                }),
                                tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
                            },
                        });
                    } catch (err) {
                        this.logger.error(`Failed to persist refreshed tokens for user ${userId}: ${err}`);
                    }
                }
            });
        }

        // Proactively refresh if token is expired or expiring within 5 minutes
        const expiresAt = tokenExpiry ? tokenExpiry.getTime() : 0;
        const fiveMinutes = 5 * 60 * 1000;
        const needsRefresh = !expiresAt || expiresAt < Date.now() + fiveMinutes;

        if (needsRefresh && refreshToken) {
            try {
                this.logger.log(`Proactively refreshing expired/expiring token for user ${userId}`);
                await auth.refreshAccessToken();
                // The 'tokens' event above will persist the new tokens automatically
            } catch (err) {
                this.logger.error(`Token refresh failed for user ${userId}: ${err}`);
                throw new Error(`Invalid Credentials — please reconnect your Gmail account`);
            }
        } else if (needsRefresh && !refreshToken) {
            throw new Error(`Invalid Credentials — no refresh token stored, please reconnect your Gmail account`);
        }

        return google.gmail({ version: 'v1', auth });
    }

    /**
     * Fetch emails since a specific timestamp (default 24h)
     */
    async fetchRecentEmails(userId: string, since?: number): Promise<RawEmail[]> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new Error('User not found');
        }

        if (!user.gmailConnected || !user.accessToken) {
            throw new Error('Gmail not connected for user');
        }

        const accessToken = this.encryptionUtil.decrypt(user.accessToken);
        const refreshToken = user.refreshToken ? this.encryptionUtil.decrypt(user.refreshToken) : undefined;

        const gmail = await this.createGmailClient(accessToken, refreshToken, userId, user.tokenExpiry);

        // Calculate timestamp for 24 hours ago if not provided
        const sinceTimestamp = since || Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
        const query = `after:${sinceTimestamp}`;

        try {
            // List messages from the time range, paginating through all results
            const totalLimit = this.configService.get<number>(
                'GMAIL_FETCH_LIMIT',
                DEFAULT_EMAIL_FETCH_LIMIT,
            );
            const pageSize = Math.min(totalLimit, 100); // Gmail API max per page is 100

            let messages: { id?: string | null; threadId?: string | null }[] = [];
            let nextPageToken: string | undefined;

            do {
                const listResponse = await gmail.users.messages.list({
                    userId: 'me',
                    q: query,
                    maxResults: pageSize,
                    pageToken: nextPageToken,
                });

                const pageMessages = listResponse.data.messages || [];
                messages = messages.concat(pageMessages);
                nextPageToken = listResponse.data.nextPageToken || undefined;

                // Stop if we've reached our total limit
                if (messages.length >= totalLimit) {
                    messages = messages.slice(0, totalLimit);
                    break;
                }
            } while (nextPageToken);

            this.logger.log(`Found ${messages.length} emails for user ${userId} (limit: ${totalLimit})`);

            // Use p-limit for concurrent fetching
            const limit = pLimit(5); // 5 concurrent requests

            const emailPromises = messages.map((msg) =>
                limit(async () => {
                    try {
                        return await this.fetchEmailDetails(gmail, msg.id!);
                    } catch (error) {
                        this.logger.warn(`Failed to fetch email ${msg.id}: ${error}`);
                        return null;
                    }
                })
            );

            const results = await Promise.all(emailPromises);
            return results.filter((e): e is RawEmail => e !== null);
        } catch (error) {
            this.logger.error(`Failed to fetch emails: ${error}`);
            throw error;
        }
    }

    /**
     * Fetch full email details
     */
    private async fetchEmailDetails(
        gmail: gmail_v1.Gmail,
        messageId: string,
    ): Promise<RawEmail | null> {
        const response = await gmail.users.messages.get({
            userId: 'me',
            id: messageId,
            format: 'full',
        });

        const message = response.data;
        const headers = message.payload?.headers || [];

        // Extract headers
        const getHeader = (name: string) =>
            headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

        const from = getHeader('From');
        const subject = getHeader('Subject');
        const dateStr = getHeader('Date');

        // Parse sender email
        const emailMatch = from.match(/<(.+)>/) || [null, from];
        const fromEmail = emailMatch[1] || from;

        // Extract body
        const body = this.extractBody(message.payload);

        return {
            id: messageId,
            threadId: message.threadId || '',
            from,
            fromEmail: fromEmail.toLowerCase().trim(),
            subject,
            snippet: message.snippet || '',
            body,
            receivedAt: dateStr ? new Date(dateStr) : new Date(),
        };
    }

    /**
     * Extract email body from payload
     */
    private extractBody(payload: gmail_v1.Schema$MessagePart | undefined): string {
        if (!payload) return '';

        // Check for plain text body
        if (payload.mimeType === 'text/plain' && payload.body?.data) {
            return this.decodeBase64(payload.body.data);
        }

        // Check for HTML body (fallback)
        if (payload.mimeType === 'text/html' && payload.body?.data) {
            return this.stripHtml(this.decodeBase64(payload.body.data));
        }

        // Check parts recursively
        if (payload.parts) {
            for (const part of payload.parts) {
                const body = this.extractBody(part);
                if (body) return body;
            }
        }

        return '';
    }

    /**
     * Decode base64 URL-safe string
     */
    private decodeBase64(data: string): string {
        const decoded = Buffer.from(data, 'base64url').toString('utf-8');
        return this.cleanEmailBody(decoded);
    }

    /**
     * Strip HTML tags
     */
    private stripHtml(html: string): string {
        return html
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Clean email body - remove signatures, footers, etc.
     */
    private cleanEmailBody(body: string): string {
        // Remove common signature patterns
        const signaturePatterns = [
            /--\s*[\r\n].*/s,                    // Standard signature delimiter
            /Sent from my.*/i,                   // Mobile signatures
            /Get Outlook for.*/i,
            /\[cid:.*\]/g,                        // Embedded images
            /_{10,}/g,                            // Long underscores
            /-{10,}/g,                            // Long dashes
        ];

        let cleaned = body;
        for (const pattern of signaturePatterns) {
            cleaned = cleaned.replace(pattern, '');
        }

        // Limit length
        return cleaned.trim().slice(0, 2000);
    }

    /**
     * Fetch calendar events since a specific timestamp (default 24h)
     */
    async fetchRecentCalendarEvents(userId: string, since?: number): Promise<RawEmail[]> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new Error('User not found');
        }

        if (!user.gmailConnected || !user.accessToken) {
            throw new Error('Google Calendar not connected for user');
        }

        const accessToken = this.encryptionUtil.decrypt(user.accessToken);
        const refreshToken = user.refreshToken ? this.encryptionUtil.decrypt(user.refreshToken) : undefined;

        // Proactively refresh or get oauth client
        const clientId = this.configService.get('GOOGLE_CLIENT_ID');
        const clientSecret = this.configService.get('GOOGLE_CLIENT_SECRET');
        const auth = new google.auth.OAuth2(clientId, clientSecret);

        auth.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken,
            expiry_date: user.tokenExpiry ? user.tokenExpiry.getTime() : undefined,
        });

        // Persist any newly refreshed tokens automatically
        auth.on('tokens', async (tokens) => {
            if (tokens.access_token) {
                this.logger.log(`Persisting refreshed tokens for user ${userId} from Calendar fetch`);
                try {
                    await this.prisma.user.update({
                        where: { id: userId },
                        data: {
                            accessToken: this.encryptionUtil.encrypt(tokens.access_token),
                            ...(tokens.refresh_token && {
                                refreshToken: this.encryptionUtil.encrypt(tokens.refresh_token),
                            }),
                            tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
                        },
                    });
                } catch (err) {
                    this.logger.error(`Failed to persist refreshed tokens for user ${userId}: ${err}`);
                }
            }
        });

        const expiresAt = user.tokenExpiry ? user.tokenExpiry.getTime() : 0;
        const fiveMinutes = 5 * 60 * 1000;
        const needsRefresh = !expiresAt || expiresAt < Date.now() + fiveMinutes;

        if (needsRefresh && refreshToken) {
            try {
                this.logger.log(`Proactively refreshing expired/expiring token for user ${userId} during Calendar fetch`);
                await auth.refreshAccessToken();
            } catch (err) {
                this.logger.error(`Token refresh failed for user ${userId}: ${err}`);
                throw new Error(`Invalid Credentials — please reconnect your Google account`);
            }
        }

        const calendar = google.calendar({ version: 'v3', auth });
        const timeMin = since
            ? new Date(since * 1000).toISOString()
            : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        // Fetch events for the next 48 hours to be helpful
        const timeMax = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

        try {
            const listResponse = await calendar.events.list({
                calendarId: 'primary',
                timeMin,
                timeMax,
                singleEvents: true,
                orderBy: 'startTime',
                maxResults: 30,
            });

            const events = listResponse.data.items || [];
            this.logger.log(`Found ${events.length} Google Calendar events for user ${userId}`);

            return events.map((event) => {
                const organizerName = event.organizer?.displayName || 'Organizer';
                const organizerAddr = event.organizer?.email?.toLowerCase().trim() || 'calendar@google.com';
                
                // Parse date fields robustly
                const startVal = event.start?.dateTime || event.start?.date;
                const endVal = event.end?.dateTime || event.end?.date;
                
                const startsAt = startVal ? new Date(startVal) : new Date();
                const endsAt = endVal ? new Date(endVal) : null;
                const location = event.location || 'Virtual / Google Meet';

                return {
                    id: `google-cal-${event.id}`,
                    threadId: event.id || '',
                    from: `${organizerName} <${organizerAddr}>`,
                    fromEmail: organizerAddr,
                    subject: `[Google Calendar] ${event.summary || '(No Title)'}`,
                    snippet: `Meeting invite: ${event.summary || '(No Title)'} on ${startsAt.toLocaleString()}`,
                    body: `Calendar Event Details:
Title: ${event.summary || '(No Title)'}
Organized by: ${organizerName}
Start: ${startsAt.toLocaleString()}
End: ${endsAt ? endsAt.toLocaleString() : 'N/A'}
Location: ${location}

Details: ${event.description || 'No description provided.'}`,
                    receivedAt: startsAt,
                };
            });
        } catch (error) {
            this.logger.error(`Failed to fetch Google Calendar events: ${error}`);
            throw error;
        }
    }
}
