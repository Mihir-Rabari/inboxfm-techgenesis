import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

export interface ReleasePayload {
    version: string;
    title: string;
    content: string;
    environment?: string;
}

@Injectable()
export class WebhookService {
    private readonly logger = new Logger(WebhookService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly mailService: MailService,
        private readonly configService: ConfigService,
    ) { }

    validateWebhookSecret(providedSecret: string): boolean {
        const expectedSecret = this.configService.get<string>('WEBHOOK_SECRET');
        if (!expectedSecret) {
            this.logger.warn('WEBHOOK_SECRET not configured, rejecting all webhooks');
            return false;
        }
        return providedSecret === expectedSecret;
    }

    async handleReleaseWebhook(payload: ReleasePayload, secret: string) {
        // Validate secret
        if (!this.validateWebhookSecret(secret)) {
            throw new UnauthorizedException('Invalid webhook secret');
        }

        this.logger.log(`Processing release webhook: ${payload.version} - ${payload.title}`);

        // Create release note record
        const releaseNote = await this.prisma.releaseNote.create({
            data: {
                version: payload.version,
                title: payload.title,
                content: payload.content,
                isPublished: true,
            },
        });

        // Get all active users
        const users = await this.prisma.user.findMany({
            where: { isActive: true },
            select: { id: true, email: true, name: true },
        });

        this.logger.log(`Broadcasting release ${payload.version} to ${users.length} users`);

        // Send release notification to all users
        const sentCount = await this.sendReleaseEmailsInBatches(
            users,
            payload.version,
            payload.title,
            payload.content,
        );

        const totalUsers = users.length;

        // Update release note with sent timestamp
        await this.prisma.releaseNote.update({
            where: { id: releaseNote.id },
            data: { sentAt: new Date() },
        });

        return {
            success: true,
            releaseId: releaseNote.id,
            version: payload.version,
            usersBroadcasted: sentCount,
            totalUsers: totalUsers,
        };
    }

    async getReleaseNotes(limit = 20) {
        return this.prisma.releaseNote.findMany({
            where: { isPublished: true },
            take: limit,
            orderBy: { createdAt: 'desc' },
        });
    }

    async createReleaseNote(data: { version: string; title: string; content: string }) {
        return this.prisma.releaseNote.create({
            data: {
                version: data.version,
                title: data.title,
                content: data.content,
                isPublished: false,
            },
        });
    }

    async publishAndBroadcast(id: string) {
        const releaseNote = await this.prisma.releaseNote.findUnique({ where: { id } });
        if (!releaseNote) {
            throw new Error('Release note not found');
        }

        // Get all active users
        const users = await this.prisma.user.findMany({
            where: { isActive: true },
            select: { id: true, email: true, name: true },
        });

        const sentCount = await this.sendReleaseEmailsInBatches(
            users,
            releaseNote.version,
            releaseNote.title,
            releaseNote.content,
        );

        const totalUsers = users.length;

        // Update release note
        await this.prisma.releaseNote.update({
            where: { id },
            data: { isPublished: true, sentAt: new Date() },
        });

        return { success: true, sentCount, totalUsers };
    }

    /**
     * Send release emails in batches to avoid overwhelming the mail service
     */
    private async sendReleaseEmailsInBatches(
        users: { id: string; email: string; name: string | null }[],
        version: string,
        title: string,
        content: string,
    ): Promise<number> {
        let sentCount = 0;
        const BATCH_SIZE = 50;

        for (let i = 0; i < users.length; i += BATCH_SIZE) {
            const batch = users.slice(i, i + BATCH_SIZE);
            const promises = batch.map(async (user) => {
                try {
                    await this.mailService.sendReleaseNotification(
                        user.email,
                        user.name || 'there',
                        version,
                        title,
                        content,
                    );
                    return true;
                } catch (err) {
                    this.logger.error(`Failed to send release email to ${user.email}`, err);
                    return false;
                }
            });

            const results = await Promise.all(promises);
            sentCount += results.filter((success) => success).length;
        }

        return sentCount;
    }
}
