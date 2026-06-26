import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

const mockSendEmail = jest.fn();

jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: mockSendEmail,
      },
    })),
  };
});

const mockPrismaService = {
  user: {
    findUnique: jest.fn().mockResolvedValue({
      id: 'user-123',
      email: 'user@example.com',
      isActive: true,
      subscribePromo: true,
      subscribeAlerts: true,
    }),
  },
  waitlist: {
    findUnique: jest.fn().mockResolvedValue({
      id: 'waitlist-123',
      email: 'user@example.com',
      status: 'APPROVED',
    }),
  },
};

describe('MailService', () => {
  let service: MailService;
  let loggerSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(async () => {
    mockSendEmail.mockClear();
    mockSendEmail.mockResolvedValue({ data: { id: 'test-id' }, error: null });
    mockPrismaService.user.findUnique.mockClear();
    mockPrismaService.waitlist.findUnique.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultVal?: any) => {
              if (key === 'FRONTEND_URL') return 'http://localhost:3000';
              if (key === 'RESEND_API_KEY') return 're_test_key';
              return defaultVal ?? null;
            }),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
            verify: jest.fn().mockReturnValue({ email: 'user@example.com' }),
          },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);

    // Suppress console logs
    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => { });
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email', async () => {
      const to = 'user@example.com';
      const name = 'Test User';

      await service.sendWelcomeEmail(to, name);

      expect(mockSendEmail).toHaveBeenCalledTimes(1);

      // Check arguments passed to emails.send
      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs).toEqual(expect.objectContaining({
        to: to,
        subject: 'Welcome to Inbox FM 🎧',
        from: 'Inbox FM <notifications@vedlabs.tech>',
      }));
      expect(callArgs.html).toContain(name);
      expect(callArgs.html).toContain('The Wait is Over');
    });

    it('should send welcome email with default greeting if name is missing', async () => {
      const to = 'user@example.com';
      const name = '';

      await service.sendWelcomeEmail(to, name);

      expect(mockSendEmail).toHaveBeenCalledTimes(1);
      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('The Wait is Over, Operator.');
    });

    it('should throw error if sending email fails', async () => {
      mockSendEmail.mockResolvedValue({ data: null, error: { message: 'Resend Error' } });
      const to = 'user@example.com';
      const name = 'Test User';

      await expect(service.sendWelcomeEmail(to, name)).rejects.toThrow('Resend Error');
    });
  });

  describe('sendDailyBriefEmail', () => {
    it('should send an email with correct content for a user with name and complete brief', async () => {
      const user = { email: 'user@example.com', name: 'John Doe' };
      const brief = {
        id: 'brief-123',
        textSummary: 'This is a summary of your emails.',
        audioUrl: 'http://audio.url/brief-123.mp3',
        audioDuration: 330, // 5 minutes 30 seconds
        emailsProcessed: 10,
      };

      await service.sendDailyBriefEmail(user, brief);

      expect(mockSendEmail).toHaveBeenCalledTimes(1);
      const callArgs = mockSendEmail.mock.calls[0][0];

      expect(callArgs.to).toBe(user.email);
      expect(callArgs.subject).toContain('Daily Briefing');
      expect(callArgs.html).toContain('Morning Recap, John.');
      expect(callArgs.html).toContain('5:30 MIN'); // 330 seconds = 5:30
      expect(callArgs.html).toContain('10 ITEMS');
      expect(callArgs.html).toContain('href="http://localhost:3000/player/brief-123"');
      expect(callArgs.html).toContain('This is a summary of your emails.');
      expect(callArgs.html).toContain('Daily Report');
    });

    it('should use fallback greeting when user name is null', async () => {
      const user = { email: 'user@example.com', name: null };
      const brief = {
        id: 'brief-123',
        textSummary: 'Summary.',
        audioUrl: 'http://audio.url',
        audioDuration: 120,
        emailsProcessed: 5,
      };

      await service.sendDailyBriefEmail(user, brief);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('Morning Recap, there.');
    });

    it('should handle null audioUrl correctly (processing state)', async () => {
      const user = { email: 'user@example.com', name: 'John' };
      const brief = {
        id: 'brief-123',
        textSummary: 'Summary.',
        audioUrl: null,
        audioDuration: null,
        emailsProcessed: 5,
      };

      await service.sendDailyBriefEmail(user, brief);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('Audio processing in progress...');
      expect(callArgs.html).not.toContain('Begin Briefing');
    });

    it('should handle null audioDuration correctly (default duration)', async () => {
      const user = { email: 'user@example.com', name: 'John' };
      const brief = {
        id: 'brief-123',
        textSummary: 'Summary.',
        audioUrl: 'http://audio.url',
        audioDuration: null,
        emailsProcessed: 5,
      };

      await service.sendDailyBriefEmail(user, brief);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain('~3:00 MIN');
    });

    it('should truncate long summaries', async () => {
      const longSummary = 'a'.repeat(600);
      const user = { email: 'user@example.com', name: 'John' };
      const brief = {
        id: 'brief-123',
        textSummary: longSummary,
        audioUrl: 'http://audio.url',
        audioDuration: 60,
        emailsProcessed: 5,
      };

      await service.sendDailyBriefEmail(user, brief);

      const callArgs = mockSendEmail.mock.calls[0][0];
      expect(callArgs.html).toContain(longSummary.slice(0, 500) + '...');
    });

    it('should handle sendMail error gracefully', async () => {
      mockSendEmail.mockResolvedValue({ data: null, error: { message: 'Resend Error' } });
      const user = { email: 'user@example.com', name: 'John' };
      const brief = {
        id: 'brief-123',
        textSummary: 'Summary',
        audioUrl: 'http://audio.url',
        audioDuration: 60,
        emailsProcessed: 5,
      };

      await expect(service.sendDailyBriefEmail(user, brief)).rejects.toThrow('Resend Error');
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to send email to user@example.com'));
    });
  });

  describe('sendGmailNotConnectedEmail', () => {
    it('should send an email when name is provided', async () => {
      const email = 'user@example.com';
      const name = 'John Doe';

      mockSendEmail.mockResolvedValueOnce({ data: { id: 'test-id' }, error: null });

      await service.sendGmailNotConnectedEmail(email, name);

      expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({
        to: email,
        subject: '⚠️ Brief Delivery Failed - Gmail Not Connected',
        html: expect.stringContaining(`Hey ${name},`),
      }));

      // Verify html content contains key elements
      const callArgs = mockSendEmail.mock.calls[0][0];
      const html = callArgs.html;
      expect(html).toContain('Gmail Connection Required');
      expect(html).toContain('Delivery Failed');

      expect(loggerSpy).toHaveBeenCalledWith(`Email sent to ${email}: ⚠️ Brief Delivery Failed - Gmail Not Connected`);
    });

    it('should send an email when name is null', async () => {
      const email = 'user@example.com';
      const name = null;

      mockSendEmail.mockResolvedValueOnce({ data: { id: 'test-id' }, error: null });

      await service.sendGmailNotConnectedEmail(email, name);

      expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({
        to: email,
        html: expect.stringContaining('Hey there,'),
      }));
    });

    it('should log error and throw if sending fails', async () => {
      const email = 'user@example.com';
      const name = 'John';
      mockSendEmail.mockResolvedValueOnce({ data: null, error: { message: 'Resend Error' } });

      await expect(service.sendGmailNotConnectedEmail(email, name)).rejects.toThrow('Resend Error');

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining(`Failed to send email to ${email}`));
    });
  });
});
