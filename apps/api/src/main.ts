import './instrument'; // MUST be the first import
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
    const logger = new Logger('Bootstrap');
    const app = await NestFactory.create(AppModule);

    const configService = app.get(ConfigService);
    const port = configService.get<number>('PORT', 3001);
    const frontendUrl = configService.get<string>('FRONTEND_URL');
    if (!frontendUrl) {
        logger.warn('⚠️ FRONTEND_URL is not defined in environment variables! Defaulting to http://localhost:3000');
    }
    const finalFrontendUrl = (frontendUrl || 'http://localhost:3000').replace(/\/$/, '');

    app.use(cookieParser());

    // Enable CORS for frontend
    const isProduction = process.env.NODE_ENV === 'production';
    const allowedOrigins = isProduction
        ? [finalFrontendUrl, 'https://inboxfm.me', 'https://www.inboxfm.me']
        : [finalFrontendUrl, 'http://localhost:3000', 'http://localhost:3001', 'https://inboxfm.me', 'https://www.inboxfm.me'];

    app.enableCors({
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // Global prefix for API routes
    app.setGlobalPrefix('api');

    // Graceful shutdown: wait for in-flight requests to finish
    app.enableShutdownHooks();

    await app.listen(port, '0.0.0.0');
    logger.log(`🎧 Inbox FM API running on http://0.0.0.0:${port}`);

    // Handle SIGTERM/SIGINT for graceful shutdown (e.g. Render, Docker)
    const shutdown = async (signal: string) => {
        logger.log(`Received ${signal}. Shutting down gracefully...`);
        await app.close();
        logger.log('Server closed.');
        process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap();
