import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateFeedbackDto {
    email: string;
    rating: number;
    message: string;
    page?: string;
    userId?: string;
}

@Injectable()
export class FeedbackService {
    private readonly logger = new Logger(FeedbackService.name);

    constructor(private readonly prisma: PrismaService) { }

    async createFeedback(data: CreateFeedbackDto) {
        this.logger.log(`New feedback from ${data.email}: ${data.rating} stars`);

        return this.prisma.feedback.create({
            data: {
                email: data.email,
                rating: Math.min(5, Math.max(1, data.rating)), // Clamp 1-5
                message: data.message,
                page: data.page,
                userId: data.userId,
            },
        });
    }

    async getAllFeedback(limit = 50) {
        return this.prisma.feedback.findMany({
            take: limit,
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getFeedbackStats() {
        const [total, ratings] = await Promise.all([
            this.prisma.feedback.count(),
            this.prisma.feedback.groupBy({
                by: ['rating'],
                _count: { rating: true },
            }),
        ]);

        // Calculate average rating
        const allFeedback = await this.prisma.feedback.findMany({
            select: { rating: true },
        });

        const avgRating = allFeedback.length > 0
            ? allFeedback.reduce((sum: number, f: any) => sum + f.rating, 0) / allFeedback.length
            : 0;

        // Create distribution object
        const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        ratings.forEach((r: any) => {
            distribution[r.rating] = r._count.rating;
        });

        return {
            total,
            averageRating: Math.round(avgRating * 10) / 10,
            distribution,
        };
    }
}
