import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailService } from './mail.service';
import { UserSignedUpEvent, UserLoggedInEvent, PasswordResetRequestedEvent } from '../auth/auth.events';

@Injectable()
export class MailListener {
    private readonly logger = new Logger(MailListener.name);

    constructor(private readonly mailService: MailService) { }

    @OnEvent('auth.signedUp')
    async handleUserSignedUpEvent(event: UserSignedUpEvent) {
        try {
            await this.mailService.sendWelcomeEmail(event.email, event.name);
        } catch (error) {
            this.logger.error(`Failed to send welcome email to ${event.email}: ${error}`);
        }
    }

    @OnEvent('auth.loggedIn')
    async handleUserLoggedInEvent(event: UserLoggedInEvent) {
        try {
            await this.mailService.sendLoginAlert(event.email);
        } catch (error) {
            this.logger.error(`Failed to send login alert to ${event.email}: ${error}`);
        }
    }

    @OnEvent('auth.passwordReset')
    async handlePasswordResetEvent(event: PasswordResetRequestedEvent) {
        try {
            await this.mailService.sendPasswordReset(event.email, event.token);
        } catch (error) {
            this.logger.error(`Failed to send password reset email to ${event.email}: ${error}`);
        }
    }
}
