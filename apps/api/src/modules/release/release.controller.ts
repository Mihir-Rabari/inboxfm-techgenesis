import { Controller, Get, Param, Query } from '@nestjs/common';
import { ReleaseService } from './release.service';

@Controller('releases')
export class ReleaseController {
    constructor(private readonly releaseService: ReleaseService) { }

    @Get()
    async getPublishedReleases() {
        return this.releaseService.findAll(true);
    }

    @Get(':slug')
    async getReleaseBySlug(@Param('slug') slug: string) {
        return this.releaseService.findBySlug(slug);
    }
}
