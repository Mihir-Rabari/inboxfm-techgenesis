import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../../prisma/prisma.service';

describe('HealthController', () => {
    let controller: HealthController;

    const mockPrismaService = {
        $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [HealthController],
            providers: [{ provide: PrismaService, useValue: mockPrismaService }],
        }).compile();

        controller = module.get<HealthController>(HealthController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should return status ok and a timestamp', async () => {
        const result = await controller.check();
        expect(result.status).toBe('ok');
        expect(typeof result.timestamp).toBe('string');
        expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });
});
