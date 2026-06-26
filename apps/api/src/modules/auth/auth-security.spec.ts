import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SummaryService } from '../summary/summary.service';
import { MailService } from '../mail/mail.service';

describe('AuthModule Security', () => {
    it('should throw an error if JWT_SECRET is missing', async () => {
        const mockConfigService = {
            get: jest.fn((key: string) => {
                if (key === 'JWT_SECRET') return undefined;
                return 'mock-value';
            }),
        };

        const moduleBuilder = Test.createTestingModule({
            imports: [AuthModule],
        })
        .overrideProvider(ConfigService)
        .useValue(mockConfigService)
        // Mocking services to avoid full system initialization
        .overrideProvider(AuthService)
        .useValue({})
        .overrideProvider(PrismaService)
        .useValue({})
        .overrideProvider(SummaryService)
        .useValue({})
        .overrideProvider(MailService)
        .useValue({});

        await expect(moduleBuilder.compile()).rejects.toThrow('JWT_SECRET environment variable is not defined');
    });
});
