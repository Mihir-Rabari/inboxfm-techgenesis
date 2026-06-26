import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SummaryService } from './summary.service';
import { GmailConnectedEvent } from '../auth/auth.events';

@Injectable()
export class SummaryListener {
    private readonly logger = new Logger(SummaryListener.name);

    constructor(private readonly summaryService: SummaryService) { }

    @OnEvent('auth.gmailConnected')
    async handleGmailConnectedEvent(event: GmailConnectedEvent) {
        // Disabled: We no longer create a default summary automatically.
        // Users should create their own schedules manually.
        this.logger.log(`User ${event.userId} connected Gmail - skipping default summary creation.`);
    }
}

