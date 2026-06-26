import { Injectable, Logger } from '@nestjs/common';
import { DailyBrief } from '@prisma/client';
import { MailService } from '../mail/mail.service';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(private readonly mailService: MailService) { }

  /**
   * Send daily brief email
   */
  async sendBriefEmail(user: { id: string; email: string; name: string | null }, brief: DailyBrief): Promise<void> {
    try {
      await this.mailService.sendDailyBriefEmail(user, brief);
      this.logger.log(`Brief email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${user.email}: ${error}`);
      throw error;
    }
  }

  /**
   * Send brief failure notification
   */
  async sendBriefErrorEmail(user: { id: string; email: string; name: string | null }, error: string): Promise<void> {
    try {
      await this.mailService.sendBriefErrorEmail(user, error);
      this.logger.log(`Brief error email sent to ${user.email}`);
    } catch (err) {
      this.logger.error(`Failed to send error email to ${user.email}: ${err}`);
    }
  }
}
