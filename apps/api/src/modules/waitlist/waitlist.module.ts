import { Module } from '@nestjs/common';
import { WaitlistController } from './waitlist.controller';
import { WaitlistService } from './waitlist.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';

@Module({
    imports: [PrismaModule, MailModule],
    controllers: [WaitlistController],
    providers: [WaitlistService],
    exports: [WaitlistService],
})
export class WaitlistModule {}
