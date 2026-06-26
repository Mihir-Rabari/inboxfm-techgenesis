import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { TicketCategory, TicketStatus, TicketPriority } from '@prisma/client';

export interface CreateTicketDto {
    email: string;
    subject: string;
    message: string;
    category?: TicketCategory;
    userId?: string;
}

export interface UpdateTicketDto {
    status?: TicketStatus;
    priority?: TicketPriority;
    adminNotes?: string;
}

@Injectable()
export class SupportService {
    private readonly logger = new Logger(SupportService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly mailService: MailService,
    ) { }

    async createTicket(data: CreateTicketDto) {
        this.logger.log(`Creating support ticket for ${data.email}`);

        const ticket = await this.prisma.supportTicket.create({
            data: {
                email: data.email,
                subject: data.subject,
                message: data.message,
                category: data.category || 'OTHER',
                userId: data.userId,
            },
        });

        // Send confirmation email to user
        await this.mailService.sendSupportConfirmation(
            data.email,
            ticket.subject,
            ticket.id.slice(0, 8).toUpperCase(),
        );

        return ticket;
    }

    async getAllTickets(filters?: { status?: TicketStatus; category?: TicketCategory }) {
        return this.prisma.supportTicket.findMany({
            where: {
                ...(filters?.status && { status: filters.status }),
                ...(filters?.category && { category: filters.category }),
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'desc' },
            ],
        });
    }

    async getTicketById(id: string) {
        const ticket = await this.prisma.supportTicket.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
        });

        if (!ticket) {
            throw new NotFoundException('Ticket not found');
        }

        return ticket;
    }

    async updateTicket(id: string, data: UpdateTicketDto) {
        const ticket = await this.getTicketById(id);

        const updateData: any = { ...data };

        // If status is being set to RESOLVED, set resolvedAt
        if (data.status === 'RESOLVED' && ticket.status !== 'RESOLVED') {
            updateData.resolvedAt = new Date();
        }

        return this.prisma.supportTicket.update({
            where: { id },
            data: updateData,
        });
    }

    async deleteTicket(id: string) {
        await this.getTicketById(id);
        return this.prisma.supportTicket.delete({ where: { id } });
    }

    async getTicketStats() {
        const [total, open, inProgress, resolved] = await Promise.all([
            this.prisma.supportTicket.count(),
            this.prisma.supportTicket.count({ where: { status: 'OPEN' } }),
            this.prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
            this.prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
        ]);

        return { total, open, inProgress, resolved };
    }
}
