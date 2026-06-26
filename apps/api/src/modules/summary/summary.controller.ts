import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SummaryService } from './summary.service';
import { CreateSummaryDto, UpdateSummaryDto } from './summary.dto';

@Controller('summary')
@UseGuards(AuthGuard('jwt'))
export class SummaryController {
    constructor(private readonly summaryService: SummaryService) { }

    @Get('schedules')
    async getSchedules(@Req() req: any) {
        return this.summaryService.getUserSchedules(req.user.id);
    }

    @Get('schedules/:id')
    async getSchedule(@Param('id') id: string, @Req() req: any) {
        return this.summaryService.getSummaryById(id, req.user.id);
    }

    @Post('schedules')
    async createSchedule(@Body() data: CreateSummaryDto, @Req() req: any) {
        return this.summaryService.createSummary(req.user.id, data);
    }

    @Patch('schedules/:id')
    async updateSchedule(
        @Param('id') id: string,
        @Body() data: UpdateSummaryDto,
        @Req() req: any,
    ) {
        return this.summaryService.updateSummary(id, req.user.id, data);
    }

    @Delete('schedules/:id')
    async deleteSchedule(@Param('id') id: string, @Req() req: any) {
        return this.summaryService.deleteSummary(id, req.user.id);
    }

    @Post('schedules/:id/toggle')
    async toggleSchedule(@Param('id') id: string, @Req() req: any) {
        return this.summaryService.toggleSummary(id, req.user.id);
    }
}
