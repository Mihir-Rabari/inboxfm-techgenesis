import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { MailService } from '../mail/mail.service';

export interface ReleaseJobData {
    email: string;
    name: string;
    version: string;
    title: string;
    content: string;
}

@Processor('release')
export class ReleaseProcessor {
    private readonly logger = new Logger(ReleaseProcessor.name);

    constructor(
        private readonly mailService: MailService,
    ) { }

    @Process('send-release-email')
    async handleSendReleaseEmail(job: Job<ReleaseJobData>) {
        const { email, name, version, title, content } = job.data;
        this.logger.log(`Processing release email for ${email}`);

        try {
            await this.mailService.sendReleaseNotification(email, name, version, title, content);
            this.logger.log(`Successfully sent release email to ${email}`);
        } catch (error) {
            this.logger.error(`Failed to send release email to ${email}: ${error.message}`);
            throw error;
        }
    }
}
