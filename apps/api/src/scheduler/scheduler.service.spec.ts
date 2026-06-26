
import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerService } from './scheduler.service';
import { BriefService } from '../modules/brief/brief.service';
import { MailService } from '../modules/mail/mail.service';
import { Logger } from '@nestjs/common';
import moment from 'moment-timezone';

describe('SchedulerService', () => {
    let service: SchedulerService;
    let briefService: BriefService;
    let loggerSpy: jest.SpyInstance;

    const mockBriefService = {
        getDeliveryConfigs: jest.fn(),
        queueBriefsForTimezone: jest.fn().mockResolvedValue(0),
        getUsersWithoutGmail: jest.fn().mockResolvedValue([]),
    };

    const mockMailService = {
        sendGmailNotConnectedEmail: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SchedulerService,
                {
                    provide: BriefService,
                    useValue: mockBriefService,
                },
                {
                    provide: MailService,
                    useValue: mockMailService,
                },
            ],
        }).compile();

        service = module.get<SchedulerService>(SchedulerService);
        briefService = module.get<BriefService>(BriefService);

        // Spy on Logger to verify logs (since we use it in the service)
        loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => { });
        jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => { });
        jest.spyOn(Logger.prototype, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should check for briefs at the current time', async () => {
        // Mock Date to a specific time (e.g., 08:30 UTC)
        const mockDate = new Date('2024-01-01T08:30:00Z');
        jest.useFakeTimers();
        jest.setSystemTime(mockDate);

        const timezone = 'Asia/Kolkata';
        // 08:30 UTC -> 14:00 IST
        const expectedTime = moment(mockDate).tz(timezone).format('HH:mm');

        mockBriefService.getDeliveryConfigs.mockResolvedValue([
            { timezone, deliveryTime: expectedTime }
        ]);
        mockBriefService.queueBriefsForTimezone.mockResolvedValue(5);

        await service.handleScheduledBriefs();

        expect(briefService.getDeliveryConfigs).toHaveBeenCalled();
        expect(briefService.queueBriefsForTimezone).toHaveBeenCalledWith(timezone, expectedTime);
        expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining(`Total queued briefs: 5`));
    });

    it('should handle multiple timezones correctly', async () => {
        const mockDate = new Date('2024-01-01T14:00:00Z');
        jest.useFakeTimers();
        jest.setSystemTime(mockDate);

        // 14:00 UTC -> 19:30 IST
        // 14:00 UTC -> 09:00 EST (America/New_York) (approx, depending on DST, assuming standard here for mock)

        const istTime = moment(mockDate).tz('Asia/Kolkata').format('HH:mm');
        const estTime = moment(mockDate).tz('America/New_York').format('HH:mm');

        mockBriefService.getDeliveryConfigs.mockResolvedValue([
            { timezone: 'Asia/Kolkata', deliveryTime: istTime },
            { timezone: 'America/New_York', deliveryTime: estTime }
        ]);
        mockBriefService.queueBriefsForTimezone.mockResolvedValue(1);

        await service.handleScheduledBriefs();

        expect(briefService.queueBriefsForTimezone).toHaveBeenCalledWith('Asia/Kolkata', istTime);
        expect(briefService.queueBriefsForTimezone).toHaveBeenCalledWith('America/New_York', estTime);
    });

    it('should not queue briefs if time does not match', async () => {
        const mockDate = new Date('2024-01-01T14:15:00Z');
        jest.useFakeTimers();
        jest.setSystemTime(mockDate);

        const timezone = 'Asia/Kolkata';
        const currentTime = moment(mockDate).tz(timezone).format('HH:mm');
        const differentTime = moment(mockDate).add(1, 'hour').tz(timezone).format('HH:mm');

        mockBriefService.getDeliveryConfigs.mockResolvedValue([
            { timezone, deliveryTime: differentTime }
        ]);

        await service.handleScheduledBriefs();

        expect(briefService.getDeliveryConfigs).toHaveBeenCalled();
        expect(briefService.queueBriefsForTimezone).not.toHaveBeenCalled();
    });
});
