
import { Test, TestingModule } from '@nestjs/testing';
import { UserService, UpdatePreferencesDto } from './user.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('UserService - Mass Assignment Vulnerability Fix Verification', () => {
    let service: UserService;
    let prismaService: PrismaService;

    const mockPrismaService = {
        user: {
            update: jest.fn().mockImplementation((args) => args),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<UserService>(UserService);
        prismaService = module.get<PrismaService>(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should NOT allow mass assignment of dangerous fields', async () => {
        const userId = 'user-123';
        const maliciousPayload: any = {
            timezone: 'UTC',
            isActive: true,
            isApproved: true,
            isAdmin: true,
        };

        await service.updatePreferences(userId, maliciousPayload);

        expect(prismaService.user.update).toHaveBeenCalledWith({
            where: { id: userId },
            data: {
                timezone: 'UTC',
                isActive: true,
            },
        });

        const updateArg = (prismaService.user.update as jest.Mock).mock.calls[0][0];
        expect(updateArg.data).not.toHaveProperty('isApproved');
        expect(updateArg.data).not.toHaveProperty('isAdmin');
    });
});
