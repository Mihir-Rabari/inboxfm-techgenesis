import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class ReleaseService {
    private readonly redis: Redis;
    private readonly CACHE_KEY = 'releases:all';
    private readonly CACHE_KEY_PREFIX = 'releases:slug:';

    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) {
        const host = this.configService.get<string>('REDIS_HOST', 'localhost');
        const port = this.configService.get<number>('REDIS_PORT', 6379);
        this.redis = new Redis({ host, port });
    }

    async findAll(publishedOnly = true) {
        if (publishedOnly) {
            // Check Redis Cache first
            try {
                const cached = await this.redis.get(this.CACHE_KEY);
                if (cached) {
                    return JSON.parse(cached);
                }
            } catch (err) {
                console.error('Failed to get releases from Redis cache:', err);
            }
        }

        const releases = await this.prisma.releaseNote.findMany({
            where: publishedOnly ? { isPublished: true } : {},
            orderBy: { createdAt: 'desc' },
        });

        if (publishedOnly) {
            // Save to Redis Cache (cache for 1 hour = 3600 seconds)
            try {
                await this.redis.setex(this.CACHE_KEY, 3600, JSON.stringify(releases));
            } catch (err) {
                console.error('Failed to save releases to Redis cache:', err);
            }
        }

        return releases;
    }

    async findBySlug(slug: string) {
        const cacheKey = `${this.CACHE_KEY_PREFIX}${slug}`;
        
        // Check Redis Cache first
        try {
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (err) {
            console.error(`Failed to get release ${slug} from Redis cache:`, err);
        }

        const release = await this.prisma.releaseNote.findUnique({
            where: { slug },
        });

        if (!release) {
            throw new NotFoundException(`Release with slug ${slug} not found`);
        }

        // Save to Redis Cache
        try {
            await this.redis.setex(cacheKey, 3600, JSON.stringify(release));
        } catch (err) {
            console.error(`Failed to save release ${slug} to Redis cache:`, err);
        }

        return release;
    }

    private async clearCache(slug?: string | null) {
        try {
            await this.redis.del(this.CACHE_KEY);
            if (slug) {
                await this.redis.del(`${this.CACHE_KEY_PREFIX}${slug}`);
            }
        } catch (err) {
            console.error('Failed to clear Redis cache for releases:', err);
        }
    }

    async create(data: any) {
        if (!data.slug) {
            data.slug = data.title
                .toLowerCase()
                .replace(/[^\w ]+/g, '')
                .replace(/ +/g, '-');
        }

        const created = await this.prisma.releaseNote.create({
            data,
        });

        await this.clearCache();
        return created;
    }

    async update(id: string, data: any) {
        const updated = await this.prisma.releaseNote.update({
            where: { id },
            data,
        });

        await this.clearCache(updated.slug);
        return updated;
    }

    async delete(id: string) {
        const deleted = await this.prisma.releaseNote.delete({
            where: { id },
        });

        await this.clearCache(deleted.slug);
        return deleted;
    }
}
