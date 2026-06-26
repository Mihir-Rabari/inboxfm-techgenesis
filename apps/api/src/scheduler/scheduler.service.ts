import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BriefService } from '../modules/brief/brief.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../modules/mail/mail.service';
import { AuthService } from '../modules/auth/auth.service';
import moment from 'moment-timezone';

@Injectable()
export class SchedulerService {
    private readonly logger = new Logger(SchedulerService.name);

    constructor(
        private readonly briefService: BriefService,
        private readonly prisma: PrismaService,
        private readonly mailService: MailService,
        private readonly authService: AuthService,
    ) { }

    /**
     * Runs every minute to check for scheduled briefs (IST timezone)
     */
    @Cron('* * * * *')
    async handleScheduledBriefs() {
        // Get all unique delivery configurations (timezone + time)
        const configs = await this.briefService.getDeliveryConfigs();

        let totalQueued = 0;

        for (const config of configs) {
            try {
                // Get current time in the schedule's timezone
                const now = moment().tz(config.timezone);
                const currentTime = now.format('HH:mm');

                // If current time matches delivery time
                if (currentTime === config.deliveryTime) {
                    const count = await this.briefService.queueBriefsForTimezone(config.timezone, config.deliveryTime);
                    totalQueued += count;
                }
            } catch (error) {
                this.logger.error(`Error processing schedule for timezone ${config.timezone}: ${error}`);
            }
        }

        if (totalQueued > 0) {
            this.logger.log(`Total queued briefs: ${totalQueued}`);
        }
    }

    /**
     * Runs every hour to check for expiring or expired Google connections (7-day policy)
     */
    @Cron('0 * * * *')
    async checkGoogleOAuthExpirations() {
        this.logger.log('Checking for expiring or expired Google connections...');
        const now = new Date();
        const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // 1. Disconnect users >= 7 days of googleConnectedAt
        const expiredUsers = await this.prisma.user.findMany({
            where: {
                gmailConnected: true,
                googleConnectedAt: {
                    lte: sevenDaysAgo,
                },
            },
        });

        for (const user of expiredUsers) {
            try {
                this.logger.log(`Disconnecting Google for user ${user.id} (${user.email}) due to 7-day expiration policy.`);
                await this.authService.disconnectGmail(user.id);
                await this.mailService.sendGoogleDisconnectedEmail(user.email, user.name);
            } catch (error) {
                this.logger.error(`Failed to disconnect/notify expired Google user ${user.id}: ${error.message}`);
            }
        }

        // 2. Warn users >= 6 days of googleConnectedAt but < 7 days, who haven't been warned yet
        const warningUsers = await this.prisma.user.findMany({
            where: {
                gmailConnected: true,
                googleWarningSent: false,
                googleConnectedAt: {
                    lte: sixDaysAgo,
                    gt: sevenDaysAgo,
                },
            },
        });

        for (const user of warningUsers) {
            try {
                this.logger.log(`Warning user ${user.id} (${user.email}) about upcoming Google 7-day expiration.`);
                await this.prisma.user.update({
                    where: { id: user.id },
                    data: { googleWarningSent: true },
                });
                await this.mailService.sendGoogleWarningEmail(user.email, user.name);
            } catch (error) {
                this.logger.error(`Failed to warn Google user ${user.id}: ${error.message}`);
            }
        }
    }
}
