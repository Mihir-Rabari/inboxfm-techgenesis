import { Test, TestingModule } from '@nestjs/testing';
import { ReleaseProcessor, ReleaseJobData } from './release.processor';
import { MailService } from '../mail/mail.service';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';

describe('ReleaseProcessor', () => {
    let processor: ReleaseProcessor;
    let mailService: MailService;

    const mockMailService = {
        sendReleaseNotification: jest.fn(),
    };

    const mockJob = {
        data: {
            email: 'test@example.com',
            name: 'Test User',
            version: '1.0.0',
            title: 'New Release',
            content: 'Release content',
        },
    } as unknown as Job<ReleaseJobData>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReleaseProcessor,
                {
                    provide: MailService,
                    useValue: mockMailService,
                },
                Logger,
            ],
        }).compile();

        processor = module.get<ReleaseProcessor>(ReleaseProcessor);
        mailService = module.get<MailService>(MailService);
    });

    it('should be defined', () => {
        expect(processor).toBeDefined();
    });

    describe('handleSendReleaseEmail', () => {
        it('should send release email', async () => {
            await processor.handleSendReleaseEmail(mockJob);

            expect(mailService.sendReleaseNotification).toHaveBeenCalledWith(
                mockJob.data.email,
                mockJob.data.name,
                mockJob.data.version,
                mockJob.data.title,
                mockJob.data.content,
            );
        });

        it('should log error if sending fails', async () => {
            const error = new Error('Failed to send');
            mockMailService.sendReleaseNotification.mockRejectedValueOnce(error);
            const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

            await expect(processor.handleSendReleaseEmail(mockJob)).rejects.toThrow(error);
            expect(loggerSpy).toHaveBeenCalled();
        });
    });
});
