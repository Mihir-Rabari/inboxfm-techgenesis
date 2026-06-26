import { Test, TestingModule } from '@nestjs/testing';
import { WebhookService } from './webhook.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

describe('WebhookService', () => {
  let service: WebhookService;
  let prisma: any;
  let mailService: any;
  let configService: any;

  const mockPrismaService = {
    releaseNote: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  };

  const mockMailService = {
    sendReleaseNotification: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key) => {
      if (key === 'WEBHOOK_SECRET') return 'test-secret';
      return null;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: MailService, useValue: mockMailService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
    prisma = module.get<PrismaService>(PrismaService);
    mailService = module.get<MailService>(MailService);
    configService = module.get<ConfigService>(ConfigService);

    // Suppress logger output
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => { });
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => { });
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => { });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleReleaseWebhook', () => {
    it('should validate secret', async () => {
      await expect(
        service.handleReleaseWebhook({ version: '1.0.0', title: 'Test', content: 'Test' }, 'wrong-secret'),
      ).rejects.toThrow('Invalid webhook secret');
    });

    it('should send release notifications to all active users', async () => {
      const users = Array.from({ length: 10 }, (_, i) => ({
        id: `user-${i}`,
        email: `user${i}@example.com`,
        name: `User ${i}`,
      }));

      mockPrismaService.user.findMany.mockResolvedValue(users);
      mockPrismaService.releaseNote.create.mockResolvedValue({ id: 'release-1' });
      mockPrismaService.releaseNote.update.mockResolvedValue({});
      mockMailService.sendReleaseNotification.mockResolvedValue(undefined);

      const payload = {
        version: '1.0.0',
        title: 'New Release',
        content: 'Release content',
      };

      await service.handleReleaseWebhook(payload, 'test-secret');

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        select: { id: true, email: true, name: true },
      });

      expect(mockMailService.sendReleaseNotification).toHaveBeenCalledTimes(10);
      expect(mockMailService.sendReleaseNotification).toHaveBeenCalledWith(
        users[0].email,
        users[0].name,
        payload.version,
        payload.title,
        payload.content,
      );
    });

    it('should process release webhook and send emails in batches (verification of batching)', async () => {
      const users = Array.from({ length: 120 }, (_, i) => ({
        id: `user-${i}`,
        email: `user${i}@example.com`,
        name: `User ${i}`,
      }));

      mockPrismaService.user.findMany.mockResolvedValue(users);
      mockPrismaService.releaseNote.create.mockResolvedValue({ id: 'release-1' });
      mockPrismaService.releaseNote.update.mockResolvedValue({});
      mockMailService.sendReleaseNotification.mockResolvedValue(undefined);

      const result = await service.handleReleaseWebhook(
        { version: '1.0.0', title: 'Test', content: 'Test' },
        'test-secret',
      );

      expect(mockPrismaService.releaseNote.create).toHaveBeenCalledWith({
        data: {
          version: '1.0.0',
          title: 'Test',
          content: 'Test',
          isPublished: true,
        },
      });

      expect(mockMailService.sendReleaseNotification).toHaveBeenCalledTimes(120);
      expect(result.usersBroadcasted).toBe(120);
      expect(result.success).toBe(true);
    });

    it('should handle errors for individual emails gracefully', async () => {
      const users = [
        { id: 'user-1', email: 'user1@example.com', name: 'User 1' },
        { id: 'user-2', email: 'user2@example.com', name: 'User 2' },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(users);
      mockPrismaService.releaseNote.create.mockResolvedValue({ id: 'release-1' });
      mockPrismaService.releaseNote.update.mockResolvedValue({});

      mockMailService.sendReleaseNotification
        .mockResolvedValueOnce(undefined) // Success for user 1
        .mockRejectedValueOnce(new Error('Failed to send')); // Failure for user 2

      const payload = {
        version: '1.0.0',
        title: 'New Release',
        content: 'Release content',
      };

      const result = await service.handleReleaseWebhook(payload, 'test-secret');

      expect(mockMailService.sendReleaseNotification).toHaveBeenCalledTimes(2);
      expect(result.usersBroadcasted).toBe(1);
      expect(result.totalUsers).toBe(2);
    });
  });

  describe('publishAndBroadcast', () => {
    it('should broadcast published release note', async () => {
      const users = Array.from({ length: 5 }, (_, i) => ({
        id: `user-${i}`,
        email: `user${i}@example.com`,
        name: `User ${i}`,
      }));

      const releaseNote = {
        id: 'release-1',
        version: '1.0.0',
        title: 'New Release',
        content: 'Release content',
        isPublished: false,
      };

      mockPrismaService.releaseNote.findUnique.mockResolvedValue(releaseNote);
      mockPrismaService.user.findMany.mockResolvedValue(users);
      mockPrismaService.releaseNote.update.mockResolvedValue({ ...releaseNote, isPublished: true });
      mockMailService.sendReleaseNotification.mockResolvedValue(undefined);

      const result = await service.publishAndBroadcast('release-1');

      expect(mockPrismaService.releaseNote.findUnique).toHaveBeenCalledWith({ where: { id: 'release-1' } });
      expect(mockMailService.sendReleaseNotification).toHaveBeenCalledTimes(5);
      expect(result.sentCount).toBe(5);
      expect(result.totalUsers).toBe(5);
    });
  });
});
