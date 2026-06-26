import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { getQueueToken } from '@nestjs/bull';

describe('AdminService', () => {
    let service: AdminService;
    let prismaService: PrismaService;
    let releaseQueue: any;

    const mockPrismaService = {
        releaseNote: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        user: {
            findMany: jest.fn(),
        },

        dailyBrief: {
            count: jest.fn(),
            aggregate: jest.fn(),
        },
        summarySchedule: {
            count: jest.fn(),
            findMany: jest.fn(),
        },
    };

    const mockMailService = {
        sendBroadcast: jest.fn(),
        sendReleaseNotification: jest.fn(),
    };

    const mockQueue = {
        addBulk: jest.fn(),
        getActiveCount: jest.fn(),
        getWaitingCount: jest.fn(),
        getCompletedCount: jest.fn(),
        getFailedCount: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdminService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: MailService,
                    useValue: mockMailService,
                },
                {
                    provide: getQueueToken('brief'),
                    useValue: mockQueue,
                },
                {
                    provide: getQueueToken('release'),
                    useValue: mockQueue,
                },
            ],
        }).compile();

        service = module.get<AdminService>(AdminService);
        prismaService = module.get<PrismaService>(PrismaService);
        releaseQueue = module.get(getQueueToken('release'));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('broadcastRelease', () => {
        it('should broadcast release to all active users via queue', async () => {
            const releaseId = 'release-1';
            const release = {
                id: releaseId,
                version: '1.0.0',
                title: 'New Feature',
                content: 'Check this out',
            };
            const users = [
                { email: 'user1@example.com', name: 'User 1' },
                { email: 'user2@example.com', name: 'User 2' },
            ];

            mockPrismaService.releaseNote.findUnique.mockResolvedValue(release);
            mockPrismaService.releaseNote.update.mockResolvedValue(release);
            mockPrismaService.user.findMany.mockResolvedValue(users);
            mockQueue.addBulk.mockResolvedValue([]);

            const result = await service.broadcastRelease(releaseId);

            expect(mockPrismaService.releaseNote.findUnique).toHaveBeenCalledWith({ where: { id: releaseId } });
            expect(mockPrismaService.releaseNote.update).toHaveBeenCalled();
            expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
                where: { isActive: true },
                select: { email: true, name: true },
            });

            expect(releaseQueue.addBulk).toHaveBeenCalledWith([
                {
                    name: 'send-release-email',
                    data: {
                        email: users[0].email,
                        name: users[0].name,
                        version: release.version,
                        title: release.title,
                        content: release.content,
                    },
                },
                {
                    name: 'send-release-email',
                    data: {
                        email: users[1].email,
                        name: users[1].name,
                        version: release.version,
                        title: release.title,
                        content: release.content,
                    },
                },
            ]);

            expect(result).toEqual({ success: true, sentCount: users.length });
        });

        it('should throw NotFoundException if release not found', async () => {
            mockPrismaService.releaseNote.findUnique.mockResolvedValue(null);

            await expect(service.broadcastRelease('non-existent')).rejects.toThrow('Release not found');
        });
    });
});
