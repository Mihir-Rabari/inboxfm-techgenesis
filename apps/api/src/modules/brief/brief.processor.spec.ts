import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { BriefProcessor } from './brief.processor';
import { PrismaService } from '../../prisma/prisma.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { AiService, ProcessedEmail, EmailAnalysis } from '../ai/ai.service';
import { AudioService } from '../audio/audio.service';
import { DeliveryService } from '../delivery/delivery.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmbeddingService } from '../ai/embedding.service';
import { Job } from 'bull';

describe('BriefProcessor', () => {
    let processor: BriefProcessor;
    let prismaService: PrismaService;
    let integrationsService: IntegrationsService;
    let aiService: AiService;
    let audioService: AudioService;
    let deliveryService: DeliveryService;
    let notificationsService: NotificationsService;
    let embeddingService: EmbeddingService;

    let mockPrismaService: any;
    let mockIntegrationsService: any;
    let mockAiService: any;
    let mockAudioService: any;
    let mockDeliveryService: any;
    let mockNotificationsService: any;
    let mockEmbeddingService: any;

    beforeEach(async () => {
        mockPrismaService = {
            user: {
                findUnique: jest.fn(),
            },
            dailyBrief: {
                update: jest.fn(),
                findUnique: jest.fn(),
            },
            senderPreference: {
                findMany: jest.fn().mockResolvedValue([]),
            },
        };

        mockIntegrationsService = {
            fetchRecentItemsFromAll: jest.fn(),
        };

        mockAiService = {
            analyzeEmails: jest.fn(),
            generateScript: jest.fn(),
            generateTextSummary: jest.fn().mockResolvedValue('Some summary'),
        };

        mockAudioService = {
            generateAudio: jest.fn(),
        };

        mockDeliveryService = {
            sendBriefEmail: jest.fn(),
            sendBriefErrorEmail: jest.fn(),
        };

        mockNotificationsService = {
            getSubscription: jest.fn(),
            sendNotification: jest.fn(),
        };

        mockEmbeddingService = {
            generateEmailEmbeddings: jest.fn(),
            findSimilarEmails: jest.fn(),
            storeEmailEmbeddings: jest.fn().mockResolvedValue(undefined),
            getHistoricalContext: jest.fn().mockResolvedValue([]),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BriefProcessor,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: IntegrationsService, useValue: mockIntegrationsService },
                { provide: AiService, useValue: mockAiService },
                { provide: AudioService, useValue: mockAudioService },
                { provide: DeliveryService, useValue: mockDeliveryService },
                { provide: NotificationsService, useValue: mockNotificationsService },
                { provide: EmbeddingService, useValue: mockEmbeddingService },
            ],
        }).compile();

        processor = module.get<BriefProcessor>(BriefProcessor);
        prismaService = module.get<PrismaService>(PrismaService);
        integrationsService = module.get<IntegrationsService>(IntegrationsService);
        aiService = module.get<AiService>(AiService);
        audioService = module.get<AudioService>(AudioService);
        deliveryService = module.get<DeliveryService>(DeliveryService);
        notificationsService = module.get<NotificationsService>(NotificationsService);
        embeddingService = module.get<EmbeddingService>(EmbeddingService);

        // Mock Logger to prevent console noise during tests
        jest.spyOn(Logger.prototype, 'log').mockImplementation(() => { });
        jest.spyOn(Logger.prototype, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should be defined', () => {
        expect(processor).toBeDefined();
    });

    describe('generateTextSummary', () => {
        const createMockEmail = (
            id: string,
            category: EmailAnalysis['category'],
            suggestedSummary: string,
            from: string = 'Sender <sender@example.com>'
        ): ProcessedEmail => ({
            id,
            threadId: `thread-${id}`,
            from,
            fromEmail: 'sender@example.com',
            subject: `Subject ${id}`,
            snippet: `Snippet ${id}`,
            body: `Body ${id}`,
            receivedAt: new Date(),
            analysis: {
                category,
                priority: 50,
                sentiment: 'neutral',
                actionRequired: false,
                keyPoints: [],
                suggestedSummary,
            },
        });

        it('should generate summary for basic email list', () => {
            const emails = [
                createMockEmail('1', 'IMPORTANT', 'Summary 1'),
                createMockEmail('2', 'PERSONAL', 'Summary 2'),
            ];

            const summary = (processor as any).generateTextSummary(emails);

            expect(summary).toContain('You have 2 new emails.');
            expect(summary).toContain('1. Sender: Summary 1');
            expect(summary).toContain('2. Sender: Summary 2');
        });

        it('should mention urgent emails', () => {
            const emails = [
                createMockEmail('1', 'URGENT', 'Summary 1'),
                createMockEmail('2', 'ACTION_REQUIRED', 'Summary 2'),
                createMockEmail('3', 'IMPORTANT', 'Summary 3'),
            ];

            const summary = (processor as any).generateTextSummary(emails);

            expect(summary).toContain('You have 3 new emails.');
            expect(summary).toContain('2 require your attention.');
            expect(summary).toContain('1. Sender: Summary 1');
        });

        it('should mention deadline emails', () => {
            const emails = [
                createMockEmail('1', 'DEADLINES', 'Summary 1'),
                createMockEmail('2', 'IMPORTANT', 'Summary 2'),
            ];

            const summary = (processor as any).generateTextSummary(emails);

            expect(summary).toContain('You have 2 new emails.');
            expect(summary).toContain('1 mention deadlines.');
        });

        it('should include top 3 emails details', () => {
            const emails = [
                createMockEmail('1', 'IMPORTANT', 'Summary 1', 'Sender 1 <s1@e.com>'),
                createMockEmail('2', 'IMPORTANT', 'Summary 2', 'Sender 2 <s2@e.com>'),
                createMockEmail('3', 'IMPORTANT', 'Summary 3', 'Sender 3 <s3@e.com>'),
                createMockEmail('4', 'IMPORTANT', 'Summary 4', 'Sender 4 <s4@e.com>'),
            ];

            const summary = (processor as any).generateTextSummary(emails);

            expect(summary).toContain('Top emails:');
            expect(summary).toContain('1. Sender 1: Summary 1');
            expect(summary).toContain('2. Sender 2: Summary 2');
            expect(summary).toContain('3. Sender 3: Summary 3');
            expect(summary).not.toContain('4. Sender 4: Summary 4');
        });

        it('should handle mixed categories correctly', () => {
            const emails = [
                createMockEmail('1', 'URGENT', 'Summary 1'),
                createMockEmail('2', 'DEADLINES', 'Summary 2'),
                createMockEmail('3', 'IMPORTANT', 'Summary 3'),
            ];

            const summary = (processor as any).generateTextSummary(emails);

            expect(summary).toContain('You have 3 new emails.');
            expect(summary).toContain('1 require your attention.');
            expect(summary).toContain('1 mention deadlines.');
        });

        it('should handle empty list', () => {
            const emails: ProcessedEmail[] = [];
            const summary = (processor as any).generateTextSummary(emails);

            expect(summary).toContain('You have 0 new emails.');
            expect(summary).not.toContain('require your attention');
            expect(summary).not.toContain('mention deadlines');
        });
    });

    describe('processBrief', () => {
        const mockJob = {
            data: {
                briefId: 'brief-123',
                userId: 'user-123',
                scheduleMetadata: {
                    voicePersona: 'NEWSROOM',
                    customPrompt: 'Make it funny',
                },
            },
        } as Job;

        const mockEmails = [
            { id: '1', snippet: 'Hello', from: 'sender@example.com', fromEmail: 'sender@example.com' },
        ];
        const mockProcessedEmails = [
            {
                ...mockEmails[0],
                analysis: {
                    category: 'URGENT',
                    suggestedSummary: 'Urgent email',
                },
            },
        ];
        const mockUser = { id: 'user-123', name: 'John Doe', email: 'john@example.com' };
        const mockScript = [{ text: 'Hello John' }];
        const mockAudio = { audioKey: 'http://audio.url', duration: 100 };

        it('should process brief successfully with emails', async () => {
            // Setup mocks
            (mockIntegrationsService.fetchRecentItemsFromAll as jest.Mock).mockResolvedValue(mockEmails);
            (aiService.analyzeEmails as jest.Mock).mockResolvedValue(mockProcessedEmails);
            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (aiService.generateScript as jest.Mock).mockResolvedValue(mockScript);
            (audioService.generateAudio as jest.Mock).mockResolvedValue(mockAudio);
            (prismaService.dailyBrief.findUnique as jest.Mock).mockResolvedValue({ id: 'brief-123' });

            // Execute
            await processor.processBrief(mockJob);

            // Verify
            expect(prismaService.dailyBrief.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'brief-123' },
                    data: expect.objectContaining({ status: 'FETCHING' }),
                })
            );
            expect(mockIntegrationsService.fetchRecentItemsFromAll).toHaveBeenCalledWith('user-123', undefined);
            expect(aiService.analyzeEmails).toHaveBeenCalledWith(mockEmails);
            expect(prismaService.user.findUnique).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: 'user-123' } })
            );
            expect(aiService.generateScript).toHaveBeenCalledWith(
                mockProcessedEmails,
                'NEWSROOM',
                'John Doe',
                'Make it funny',
                []
            );
            expect(audioService.generateAudio).toHaveBeenCalledWith(
                mockScript,
                'NEWSROOM',
                'brief-123'
            );
            expect(prismaService.dailyBrief.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'brief-123' },
                    data: expect.objectContaining({
                        status: 'DELIVERING',
                        audioUrl: 'http://audio.url',
                        audioDuration: 100,
                    }),
                })
            );
            expect(deliveryService.sendBriefEmail).toHaveBeenCalled();
            expect(prismaService.dailyBrief.update).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    where: { id: 'brief-123' },
                    data: expect.objectContaining({ status: 'DELIVERED' }),
                })
            );
        });

        it('should complete with no emails if fetch returns empty', async () => {
            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (mockIntegrationsService.fetchRecentItemsFromAll as jest.Mock).mockResolvedValue([]);

            await processor.processBrief(mockJob);

            expect(prismaService.dailyBrief.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'brief-123' },
                    data: expect.objectContaining({
                        status: 'DELIVERED',
                        emailsProcessed: 0,
                        textSummary: expect.stringContaining('No calendar-relevant events'),
                    }),
                })
            );
            expect(aiService.analyzeEmails).not.toHaveBeenCalled();
            expect(deliveryService.sendBriefEmail).not.toHaveBeenCalled();
        });

        it('should throw error if user not found', async () => {
            (mockIntegrationsService.fetchRecentItemsFromAll as jest.Mock).mockResolvedValue(mockEmails);
            (aiService.analyzeEmails as jest.Mock).mockResolvedValue(mockProcessedEmails);
            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(processor.processBrief(mockJob)).rejects.toThrow('User not found');

            expect(prismaService.dailyBrief.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'brief-123' },
                    data: expect.objectContaining({
                        status: 'FAILED',
                        errorMessage: expect.stringContaining('User not found'),
                    }),
                })
            );
        });

        it('should handle errors gracefully and update status to FAILED', async () => {
            const error = new Error('AI Service failed');
            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (mockIntegrationsService.fetchRecentItemsFromAll as jest.Mock).mockResolvedValue(mockEmails);
            (aiService.analyzeEmails as jest.Mock).mockRejectedValue(error);

            await expect(processor.processBrief(mockJob)).rejects.toThrow('AI Service failed');

            expect(prismaService.dailyBrief.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'brief-123' },
                    data: expect.objectContaining({
                        status: 'FAILED',
                        errorMessage: expect.stringContaining('AI Service failed'),
                    }),
                })
            );
        });

        it('should use default voice persona and no custom prompt if metadata is missing', async () => {
            const jobWithoutMetadata = {
                data: {
                    briefId: 'brief-123',
                    userId: 'user-123',
                    scheduleMetadata: {},
                },
            } as Job;

            (mockIntegrationsService.fetchRecentItemsFromAll as jest.Mock).mockResolvedValue(mockEmails);
            (aiService.analyzeEmails as jest.Mock).mockResolvedValue(mockProcessedEmails);
            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (aiService.generateScript as jest.Mock).mockResolvedValue(mockScript);
            (audioService.generateAudio as jest.Mock).mockResolvedValue(mockAudio);
            (prismaService.dailyBrief.findUnique as jest.Mock).mockResolvedValue({ id: 'brief-123' });

            await processor.processBrief(jobWithoutMetadata);

            expect(aiService.generateScript).toHaveBeenCalledWith(
                expect.any(Array),
                'NEWSROOM', // Default
                'John Doe',
                undefined,
                []
            );
        });
    });

    describe('getCategoryCounts', () => {
        // Helper to access private method
        const getCategoryCounts = (emails: ProcessedEmail[]): Record<string, number> => {
            return (processor as any).getCategoryCounts(emails);
        };

        it('should return empty object for no emails', () => {
            const result = getCategoryCounts([]);
            expect(result).toEqual({});
        });

        it('should count single category correctly', () => {
            const emails = [
                { analysis: { category: 'URGENT' } }
            ] as ProcessedEmail[];

            const result = getCategoryCounts(emails);
            expect(result).toEqual({ URGENT: 1 });
        });

        it('should count multiple categories correctly', () => {
            const emails = [
                { analysis: { category: 'URGENT' } },
                { analysis: { category: 'NEWSLETTERS' } },
                { analysis: { category: 'PERSONAL' } }
            ] as ProcessedEmail[];

            const result = getCategoryCounts(emails);
            expect(result).toEqual({
                URGENT: 1,
                NEWSLETTERS: 1,
                PERSONAL: 1
            });
        });

        it('should aggregate counts for same category', () => {
            const emails = [
                { analysis: { category: 'URGENT' } },
                { analysis: { category: 'URGENT' } },
                { analysis: { category: 'NEWSLETTERS' } }
            ] as ProcessedEmail[];

            const result = getCategoryCounts(emails);
            expect(result).toEqual({
                URGENT: 2,
                NEWSLETTERS: 1
            });
        });

        it('should handle undefined categories gracefully if types allow (though types say string)', () => {
            const emails = [
                { analysis: { category: undefined } }
            ] as any as ProcessedEmail[];

            const result = getCategoryCounts(emails);
            expect(result).toEqual({ undefined: 1 });
        });
    });
});
