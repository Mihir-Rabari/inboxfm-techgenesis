import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor() {
        super({
            // Log slow queries (> 1000ms) in all environments, full query in development
            log:
                process.env.NODE_ENV === 'development'
                    ? [
                          { emit: 'event', level: 'query' },
                          { emit: 'stdout', level: 'warn' },
                          { emit: 'stdout', level: 'error' },
                      ]
                    : [
                          { emit: 'stdout', level: 'warn' },
                          { emit: 'stdout', level: 'error' },
                      ],
        });

        if (process.env.NODE_ENV === 'development') {
            // Log slow queries (> 500ms) during development
            (this as any).$on('query', (e: { duration: number; query: string }) => {
                if (e.duration > 500) {
                    this.logger.warn(`Slow query (${e.duration}ms): ${e.query.slice(0, 200)}`);
                }
            });
        }
    }

    async onModuleInit() {
        try {
            await this.$connect();
            this.logger.log('📦 Database connected');
        } catch (error) {
            this.logger.error('❌ Database connection failed during startup', error);
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
