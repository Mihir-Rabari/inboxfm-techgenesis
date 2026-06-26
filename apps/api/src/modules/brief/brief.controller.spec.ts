import { Test, TestingModule } from '@nestjs/testing';
import { BriefController } from './brief.controller';
import { BriefService } from './brief.service';
import { Request } from 'express';
import { User } from '@prisma/client';

describe('BriefController', () => {
  let controller: BriefController;
  let service: BriefService;

  const mockBriefService = {
    getBrief: jest.fn(),
    getUserBriefs: jest.fn(),
    queueBriefGeneration: jest.fn(),
    deleteBrief: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BriefController],
      providers: [
        {
          provide: BriefService,
          useValue: mockBriefService,
        },
      ],
    }).compile();

    controller = module.get<BriefController>(BriefController);
    service = module.get<BriefService>(BriefService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getBrief', () => {
    it('should call service.getBrief with userId from request', async () => {
      const briefId = 'brief-123';
      const userId = 'user-456';
      const user = { id: userId } as User;
      const request = { user } as unknown as Request;
      const expectedBrief = { id: briefId, userId };

      mockBriefService.getBrief.mockResolvedValue(expectedBrief);

      const result = await controller.getBrief(request, briefId);

      expect(mockBriefService.getBrief).toHaveBeenCalledWith(userId, briefId);
      expect(result).toEqual(expectedBrief);
    });
  });

  describe('getBriefs', () => {
    it('should call service.getUserBriefs with userId from request', async () => {
      const userId = 'user-456';
      const user = { id: userId } as User;
      const request = { user } as unknown as Request;
      const expectedBriefs = [{ id: 'b1', userId }];

      mockBriefService.getUserBriefs.mockResolvedValue(expectedBriefs);

      const result = await controller.getBriefs(request);

      expect(mockBriefService.getUserBriefs).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedBriefs);
    });
  });

  describe('generateBrief', () => {
    it('should call service.queueBriefGeneration with userId from request', async () => {
      const userId = 'user-456';
      const user = { id: userId } as User;
      const request = { user } as unknown as Request;
      const briefId = 'new-brief-id';

      mockBriefService.queueBriefGeneration.mockResolvedValue(briefId);

      const result = await controller.generateBrief(request);

      expect(mockBriefService.queueBriefGeneration).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ briefId, message: 'Brief generation queued' });
    });
  });

  describe('deleteBrief', () => {
    it('should call service.deleteBrief with userId from request', async () => {
      const briefId = 'brief-123';
      const userId = 'user-456';
      const user = { id: userId } as User;
      const request = { user } as unknown as Request;

      mockBriefService.deleteBrief.mockResolvedValue({ count: 1 });

      const result = await controller.deleteBrief(briefId, request);

      expect(mockBriefService.deleteBrief).toHaveBeenCalledWith(briefId, userId);
      expect(result).toEqual({ success: true, message: 'Brief deleted successfully' });
    });
  });
});
