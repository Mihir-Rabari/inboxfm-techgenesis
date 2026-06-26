import { Test, TestingModule } from '@nestjs/testing';
import { BriefService } from './brief.service';
import { PrismaService } from '../../prisma/prisma.service';
import { getQueueToken } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { BriefStatus } from '@prisma/client';
import { AudioService } from '../audio/audio.service';

describe('BriefService', () => {
  let service: BriefService;
  let prisma: PrismaService;
  let queue: any;
  let audioService: AudioService;

  const mockPrismaService = {
    dailyBrief: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
    },
    summarySchedule: {
      findMany: jest.fn(),
    },
  };

  const mockQueue = {
    add: jest.fn(),
  };

  const mockAudioService = {
    getPresignedUrl: jest.fn((url) => Promise.resolve(`signed-${url}`)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BriefService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: getQueueToken('brief'),
          useValue: mockQueue,
        },
        {
          provide: AudioService,
          useValue: mockAudioService,
        },
      ],
    }).compile();

    service = module.get<BriefService>(BriefService);
    prisma = module.get<PrismaService>(PrismaService);
    queue = module.get(getQueueToken('brief'));
    audioService = module.get<AudioService>(AudioService);

    // Silence logger
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => { });
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => { });
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => { });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('queueBriefGeneration', () => {
    it('should queue a brief generation job successfully', async () => {
      const userId = 'user-123';
      const scheduleMetadata = { voicePersona: 'persona1', customPrompt: 'prompt1' };
      const briefId = 'brief-123';

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      mockPrismaService.dailyBrief.findFirst.mockResolvedValue(null);
      mockPrismaService.dailyBrief.create.mockResolvedValue({
        id: briefId,
        userId,
        date: today,
        status: 'PENDING',
      });

      const result = await service.queueBriefGeneration(userId, undefined, scheduleMetadata);

      expect(mockPrismaService.dailyBrief.findFirst).toHaveBeenCalled();
      expect(mockPrismaService.dailyBrief.create).toHaveBeenCalled();
      expect(mockQueue.add).toHaveBeenCalledWith(
        'generate',
        { userId, briefId, scheduleId: undefined, scheduleMetadata },
        expect.any(Object),
      );
      expect(result).toBe(briefId);
    });
  });

  describe('deleteBrief', () => {
    it('should delete brief by ID checking ownership', async () => {
      const briefId = 'brief-123';
      const userId = 'user-456';

      await service.deleteBrief(briefId, userId);

      expect(mockPrismaService.dailyBrief.deleteMany).toHaveBeenCalledWith({
        where: { id: briefId, userId },
      });
    });
  });

  describe('updateStatus', () => {
    it('should update brief status', async () => {
      const briefId = 'brief-123';
      const status = 'COMPLETED' as BriefStatus;

      mockPrismaService.dailyBrief.update.mockResolvedValue({ id: briefId, status });

      await service.updateStatus(briefId, status);

      expect(mockPrismaService.dailyBrief.update).toHaveBeenCalledWith({
        where: { id: briefId },
        data: { status, errorMessage: undefined },
      });
    });
  });

  describe('getUserBriefs', () => {
    it('should get user briefs and sign audio URLs', async () => {
      const userId = 'user-123';
      const briefs = [
        { id: 'b1', audioUrl: 'key1.mp3', date: new Date() },
        { id: 'b2', audioUrl: 'http://foo.com/bar.mp3', date: new Date() }
      ];

      mockPrismaService.dailyBrief.findMany.mockResolvedValue(briefs);

      const result = await service.getUserBriefs(userId);

      expect(result[0].audioUrl).toBe('signed-key1.mp3'); // Signed
      expect(result[1].audioUrl).toBe('http://foo.com/bar.mp3'); // Not signed
    });
  });

  describe('getBrief', () => {
    it('should query brief with userId to prevent IDOR', async () => {
      const briefId = 'brief-123';
      const userId = 'user-456';
      const brief = { id: briefId, userId, audioUrl: null };

      mockPrismaService.dailyBrief.findFirst.mockResolvedValue(brief);

      const result = await service.getBrief(userId, briefId);

      expect(mockPrismaService.dailyBrief.findFirst).toHaveBeenCalledWith({
        where: { id: briefId, userId },
      });
      expect(result).toEqual(brief);
    });
  });

  describe('getActiveUsersForTime', () => {
    it('should return active users for scheduled time', async () => {
      const time = '08:00';
      const schedules = [{ userId: 'user-1' }, { userId: 'user-2' }];

      mockPrismaService.summarySchedule.findMany.mockResolvedValue(schedules);

      const result = await service.getActiveUsersForTime(time);

      expect(mockPrismaService.summarySchedule.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ deliveryTime: time }),
      }));
      expect(result).toEqual(['user-1', 'user-2']);
    });
  });

  describe('getUsersWithoutGmail', () => {
    it('should return users without gmail connection', async () => {
      const time = '08:00';
      const schedules = [
        { userId: 'u1', user: { email: 'u1@test.com' } }
      ];

      mockPrismaService.summarySchedule.findMany.mockResolvedValue(schedules);

      const result = await service.getUsersWithoutGmail(time);

      expect(result).toEqual([{ userId: 'u1', email: 'u1@test.com' }]);
    });
  });

  describe('getDeliveryConfigs', () => {
    it('should find distinct delivery configurations', async () => {
      const configs = [{ timezone: 'UTC', deliveryTime: '09:00' }];
      mockPrismaService.summarySchedule.findMany.mockResolvedValue(configs);

      const result = await service.getDeliveryConfigs();

      expect(mockPrismaService.summarySchedule.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        select: { timezone: true, deliveryTime: true },
        distinct: ['timezone', 'deliveryTime'],
      });
      expect(result).toBe(configs);
    });
  });

  describe('queueBriefsForTimezone', () => {
    it('should queue briefs for timezone and time', async () => {
      const timezone = 'Asia/Kolkata';
      const deliveryTime = '08:00';
      const schedules = [
        { id: 's1', userId: 'u1', voicePersona: 'vp1', customPrompt: null },
        { id: 's2', userId: 'u2', voicePersona: 'vp2', customPrompt: 'cp2' },
      ];

      mockPrismaService.summarySchedule.findMany.mockResolvedValue(schedules);

      // Spy on queueBriefGeneration
      const queueSpy = jest.spyOn(service, 'queueBriefGeneration').mockResolvedValue('brief-id');

      const count = await service.queueBriefsForTimezone(timezone, deliveryTime);

      expect(mockPrismaService.summarySchedule.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ timezone, deliveryTime }),
      }));

      expect(queueSpy).toHaveBeenCalledTimes(2);
      expect(queueSpy).toHaveBeenCalledWith('u1', 's1', expect.objectContaining({ voicePersona: 'vp1' }));
      expect(queueSpy).toHaveBeenCalledWith('u2', 's2', expect.objectContaining({ customPrompt: 'cp2' }));

      expect(count).toBe(2);
    });
  });
});
