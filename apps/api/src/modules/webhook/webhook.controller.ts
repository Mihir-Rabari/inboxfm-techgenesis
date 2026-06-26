import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Headers,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WebhookService, ReleasePayload } from './webhook.service';

@Controller('webhook')
export class WebhookController {
    constructor(private readonly webhookService: WebhookService) { }

    // Webhook endpoint for CI/CD deployments
    @Post('release')
    async handleRelease(
        @Body() payload: ReleasePayload,
        @Headers('x-webhook-secret') secret: string,
    ) {
        return this.webhookService.handleReleaseWebhook(payload, secret);
    }
}

// Separate controller for admin release management
@Controller('admin/releases')
export class ReleaseAdminController {
    constructor(private readonly webhookService: WebhookService) { }

    @UseGuards(AuthGuard('jwt'))
    @Get()
    async getReleaseNotes() {
        return this.webhookService.getReleaseNotes();
    }

    @UseGuards(AuthGuard('jwt'))
    @Post()
    async createReleaseNote(
        @Body() data: { version: string; title: string; content: string },
    ) {
        return this.webhookService.createReleaseNote(data);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/broadcast')
    async publishAndBroadcast(@Param('id') id: string) {
        return this.webhookService.publishAndBroadcast(id);
    }
}
