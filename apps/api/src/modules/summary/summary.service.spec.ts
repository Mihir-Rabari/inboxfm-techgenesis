import { Test, TestingModule } from '@nestjs/testing';
import { SummaryService } from './summary.service';
import { CreateSummaryDto, UpdateSummaryDto } from './summary.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { VoicePersona } from '@prisma/client';
import {
    DEFAULT_SUMMARY_NAME,
    DEFAULT_DELIVERY_TIME,
    DEFAULT_TIMEZONE,
    DEFAULT_VOICE_PERSONA,
    DEFAULT_EMAILS_FROM,
} from './summary.constants';

describe('SummaryService', () => {
    let service: SummaryService;
    let prisma: PrismaService;

    const mockSummarySchedule = {
        id: 'summary-123',
        userId: 'user-123',
        name: 'Morning Summary',
        deliveryTime: '07:00',
        timezone: 'UTC',
        voicePersona: 'NEWSROOM' as VoicePersona,
        emailsFrom: 'last_delivery',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockPrismaService = {
        summarySchedule: {
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SummaryService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<SummaryService>(SummaryService);
        prisma = module.get<PrismaService>(PrismaService);

        // Spy on Logger to suppress logs during tests
        jest.spyOn(Logger.prototype, 'log').mockImplementation(() => { });
        jest.spyOn(Logger.prototype, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createDefaultSummary', () => {
        it('should use constants when creating a default summary', async () => {
            const userId = 'user-123';
            mockPrismaService.summarySchedule.findFirst.mockResolvedValue(null);
            mockPrismaService.summarySchedule.create.mockResolvedValue({ id: 'summary-123', userId });

            await service.createDefaultSummary(userId);

            expect(mockPrismaService.summarySchedule.findFirst).toHaveBeenCalledWith({
                where: { userId, name: DEFAULT_SUMMARY_NAME },
            });

            expect(mockPrismaService.summarySchedule.create).toHaveBeenCalledWith({
                data: {
                    userId,
                    name: DEFAULT_SUMMARY_NAME,
                    deliveryTime: DEFAULT_DELIVERY_TIME,
                    timezone: DEFAULT_TIMEZONE,
                    voicePersona: DEFAULT_VOICE_PERSONA,
                    emailsFrom: DEFAULT_EMAILS_FROM,
                    isActive: true,
                },
            });
        });

        it('should return existing summary if it already exists', async () => {
            const userId = 'user-123';
            mockPrismaService.summarySchedule.findFirst.mockResolvedValue(mockSummarySchedule);

            const result = await service.createDefaultSummary(userId);

            expect(result).toBe(mockSummarySchedule);
            expect(mockPrismaService.summarySchedule.create).not.toHaveBeenCalled();
        });
    });

    describe('createSummary', () => {
        const userId = 'user-123';
        const createDto: CreateSummaryDto = {
            name: 'Morning News',
            deliveryTime: '08:00',
            timezone: 'UTC',
            voicePersona: 'NEWSROOM',
            emailsFrom: 'last_delivery',
            isActive: true,
        };

        it('should create a summary successfully', async () => {
            mockPrismaService.summarySchedule.count.mockResolvedValue(0);
            mockPrismaService.summarySchedule.create.mockResolvedValue({
                id: 'summary-1',
                userId,
                ...createDto,
            });

            const result = await service.createSummary(userId, createDto);

            expect(mockPrismaService.summarySchedule.count).toHaveBeenCalledWith({
                where: { userId, name: createDto.name },
            });
            expect(mockPrismaService.summarySchedule.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId,
                    name: createDto.name,
                    deliveryTime: createDto.deliveryTime,
                }),
            });
            expect(result).toEqual(expect.objectContaining({
                id: 'summary-1',
                userId,
                name: createDto.name,
            }));
        });

        it('should throw BadRequestException for invalid time format (hour out of range)', async () => {
            const invalidDto = { ...createDto, deliveryTime: '25:00' };
            await expect(service.createSummary(userId, invalidDto)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if summary name already exists', async () => {
            mockPrismaService.summarySchedule.count.mockResolvedValue(1);

            await expect(service.createSummary(userId, createDto)).rejects.toThrow(BadRequestException);
        });
    });

    describe('updateSummary', () => {
        it('should update a summary successfully', async () => {
            const updateDto: UpdateSummaryDto = {
                name: 'Updated Summary',
                deliveryTime: '08:00',
            };

            mockPrismaService.summarySchedule.findFirst.mockResolvedValue(mockSummarySchedule);
            mockPrismaService.summarySchedule.update.mockResolvedValue({
                ...mockSummarySchedule,
                ...updateDto,
            });

            const result = await service.updateSummary('summary-123', 'user-123', updateDto);

            expect(mockPrismaService.summarySchedule.findFirst).toHaveBeenCalledWith({
                where: { id: 'summary-123', userId: 'user-123' },
            });
            expect(mockPrismaService.summarySchedule.update).toHaveBeenCalledWith({
                where: { id: 'summary-123' },
                data: expect.objectContaining({
                    name: 'Updated Summary',
                    deliveryTime: '08:00',
                }),
            });
            expect(result.name).toBe('Updated Summary');
            expect(result.deliveryTime).toBe('08:00');
        });

        it('should throw NotFoundException if summary not found or user not owner', async () => {
            mockPrismaService.summarySchedule.findFirst.mockResolvedValue(null);

            await expect(
                service.updateSummary('summary-123', 'user-123', { name: 'New Name' }),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException for invalid deliveryTime format', async () => {
            mockPrismaService.summarySchedule.findFirst.mockResolvedValue(mockSummarySchedule);

            const invalidDto: UpdateSummaryDto = {
                deliveryTime: '25:00', // Invalid hour
            };

            await expect(
                service.updateSummary('summary-123', 'user-123', invalidDto),
            ).rejects.toThrow(BadRequestException);

            // Should not call update
            expect(mockPrismaService.summarySchedule.update).not.toHaveBeenCalled();
        });

        it('should allow valid deliveryTime format', async () => {
            const updateDto: UpdateSummaryDto = {
                deliveryTime: '14:30',
            };

            mockPrismaService.summarySchedule.findFirst.mockResolvedValue(mockSummarySchedule);
            mockPrismaService.summarySchedule.update.mockResolvedValue({
                ...mockSummarySchedule,
                deliveryTime: '14:30',
            });

            await service.updateSummary('summary-123', 'user-123', updateDto);

            expect(mockPrismaService.summarySchedule.update).toHaveBeenCalledWith({
                where: { id: 'summary-123' },
                data: expect.objectContaining({ deliveryTime: '14:30' }),
            });
        });
    });
});
