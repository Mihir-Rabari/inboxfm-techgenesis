import { Module } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { MailModule } from '../mail/mail.module';

@Module({
    imports: [MailModule],
    providers: [DeliveryService],
    exports: [DeliveryService],
})
export class DeliveryModule { }
