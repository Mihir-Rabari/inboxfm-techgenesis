import {
    Controller,
    Get,
    Post,
    Body,
    UseGuards,
    Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FeedbackService, CreateFeedbackDto } from './feedback.service';

@Controller('feedback')
export class FeedbackController {
    constructor(private readonly feedbackService: FeedbackService) { }

    // Public endpoint - anyone can submit feedback
    @Post()
    async createFeedback(@Body() data: CreateFeedbackDto, @Req() req: any) {
        const userId = req.user?.id;
        return this.feedbackService.createFeedback({
            ...data,
            userId,
        });
    }

    // Admin only endpoints
    @UseGuards(AuthGuard('jwt'))
    @Get()
    async getAllFeedback() {
        return this.feedbackService.getAllFeedback();
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('stats')
    async getFeedbackStats() {
        return this.feedbackService.getFeedbackStats();
    }
}
