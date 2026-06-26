import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailListener } from './mail.listener';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [
        ConfigModule,
        PrismaModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => {
                const secret = configService.get<string>('JWT_SECRET');
                if (!secret) {
                    throw new Error('JWT_SECRET environment variable is not defined');
                }
                return {
                    secret,
                };
            },
            inject: [ConfigService],
        }),
    ],
    providers: [MailService, MailListener],
    exports: [MailService],
})
export class MailModule { }
