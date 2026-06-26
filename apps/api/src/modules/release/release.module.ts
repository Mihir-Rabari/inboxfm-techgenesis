import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ReleaseService } from './release.service';
import { ReleaseController } from './release.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule, ConfigModule],
    controllers: [ReleaseController],
    providers: [ReleaseService],
    exports: [ReleaseService],
})
export class ReleaseModule { }
