import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SupportService, CreateTicketDto, UpdateTicketDto } from './support.service';
import { TicketCategory, TicketStatus } from '@prisma/client';

@Controller('support')
export class SupportController {
    constructor(private readonly supportService: SupportService) { }

    // Public endpoint - anyone can create a ticket
    @Post('tickets')
    async createTicket(@Body() data: CreateTicketDto, @Req() req: any) {
        // If user is authenticated, attach their ID
        const userId = req.user?.id;
        return this.supportService.createTicket({
            ...data,
            userId,
        });
    }

    // Admin only endpoints below
    @UseGuards(AuthGuard('jwt'))
    @Get('tickets')
    async getAllTickets(
        @Query('status') status?: TicketStatus,
        @Query('category') category?: TicketCategory,
    ) {
        return this.supportService.getAllTickets({ status, category });
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('tickets/stats')
    async getTicketStats() {
        return this.supportService.getTicketStats();
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('tickets/:id')
    async getTicketById(@Param('id') id: string) {
        return this.supportService.getTicketById(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch('tickets/:id')
    async updateTicket(@Param('id') id: string, @Body() data: UpdateTicketDto) {
        return this.supportService.updateTicket(id, data);
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete('tickets/:id')
    async deleteTicket(@Param('id') id: string) {
        return this.supportService.deleteTicket(id);
    }
}
