import { Module } from '@nestjs/common';
import { SummaryController } from './summary.controller';
import { SummaryService } from './summary.service';
import { SummaryListener } from './summary.listener';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [SummaryController],
    providers: [SummaryService, SummaryListener],
    exports: [SummaryService],
})
export class SummaryModule { }
