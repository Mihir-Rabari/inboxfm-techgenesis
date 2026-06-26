import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../../prisma/prisma.service';

@SkipThrottle()
@Controller('health')
export class HealthController {
    constructor(private readonly prisma: PrismaService) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    async check() {
        const checks: Record<string, string> = { api: 'ok' };

        // Check database connectivity
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            checks['database'] = 'ok';
        } catch {
            checks['database'] = 'error';
        }

        const allOk = Object.values(checks).every((v) => v === 'ok');

        return {
            status: allOk ? 'ok' : 'degraded',
            checks,
            timestamp: new Date().toISOString(),
            uptime: Math.floor(process.uptime()),
        };
    }
}
