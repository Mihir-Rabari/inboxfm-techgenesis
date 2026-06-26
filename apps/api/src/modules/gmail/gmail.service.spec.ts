import { Test, TestingModule } from '@nestjs/testing';
import { GmailService } from './gmail.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { EncryptionUtil } from '../../utils/encryption.util';
import { Logger } from '@nestjs/common';
import { google } from 'googleapis';

// Mock googleapis
jest.mock('googleapis', () => {
  const mGmail = {
    users: {
      messages: {
        list: jest.fn(),
        get: jest.fn(),
      },
    },
  };

  return {
    google: {
      auth: {
        OAuth2: jest.fn().mockImplementation(() => ({
          setCredentials: jest.fn(),
          on: jest.fn(),
        })),
      },
      gmail: jest.fn(() => mGmail),
    },
  };
});

describe('GmailService', () => {
  let service: GmailService;
  let prismaService: PrismaService;
  let configService: ConfigService;
  let gmailClientMock: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Access the mocked gmail client
    // @ts-ignore
    gmailClientMock = google.gmail();

    // Mock Logger to prevent console noise
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => { });
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => { });
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => { });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GmailService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: EncryptionUtil,
          useValue: {
            encrypt: jest.fn(),
            decrypt: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GmailService>(GmailService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('cleanEmailBody', () => {
    it('should remove standard signatures starting with "-- "', () => {
      const body = 'Hello there.\n-- \nBest regards,\nJohn Doe';
      const expected = 'Hello there.';
      const result = (service as any).cleanEmailBody(body);
      expect(result).toBe(expected);
    });

    it('should remove "Sent from my..." signatures', () => {
      const body = 'See you soon.\nSent from my iPhone';
      const expected = 'See you soon.';
      const result = (service as any).cleanEmailBody(body);
      expect(result).toBe(expected);
    });

    it('should remove "Get Outlook for..." signatures', () => {
      const body = 'Meeting confirmed.\nGet Outlook for Android';
      const expected = 'Meeting confirmed.';
      const result = (service as any).cleanEmailBody(body);
      expect(result).toBe(expected);
    });

    it('should remove embedded images with [cid:...]', () => {
      const body = 'Check this out: [cid:image001.png@01D9D9D9.12345678]';
      const expected = 'Check this out:';
      const result = (service as any).cleanEmailBody(body);
      expect(result).toBe(expected);
    });

    it('should remove long underscores', () => {
      const body = 'End of message.\n____________________';
      const expected = 'End of message.';
      const result = (service as any).cleanEmailBody(body);
      expect(result).toBe(expected);
    });

    it('should remove long dashes', () => {
      const body = 'Separation line.\n--------------------';
      const expected = 'Separation line.';
      const result = (service as any).cleanEmailBody(body);
      expect(result).toBe(expected);
    });

    it('should truncate body to 2000 characters', () => {
      const longBody = 'a'.repeat(2500);
      const result = (service as any).cleanEmailBody(longBody);
      expect(result.length).toBe(2000);
      expect(result).toBe('a'.repeat(2000));
    });

    it('should handle body shorter than 2000 characters without truncation', () => {
      const shortBody = 'Short message.';
      const result = (service as any).cleanEmailBody(shortBody);
      expect(result).toBe(shortBody);
    });

    it('should handle multiple cleaning patterns in one body', () => {
      const body = 'Here is the report.\n[cid:logo.png]\n-- \nSent from my iPad';
      const expected = 'Here is the report.';
      const result = (service as any).cleanEmailBody(body);
      expect(result).toBe(expected);
    });

    it('should handle signatures with varying whitespace after "--"', () => {
      const body = 'Message content.\n--  \nSignature';
      const expected = 'Message content.';
      const result = (service as any).cleanEmailBody(body);
      expect(result).toBe(expected);
    });
  });

  describe('extractBody', () => {
    it('should return empty string if payload is undefined', () => {
      const result = (service as any).extractBody(undefined);
      expect(result).toBe('');
    });

    it('should extract plain text body', () => {
      const content = 'Hello world';
      const encoded = Buffer.from(content).toString('base64url');
      const payload = {
        mimeType: 'text/plain',
        body: { data: encoded },
      };
      const result = (service as any).extractBody(payload);
      expect(result).toBe(content);
    });

    it('should extract and strip HTML body', () => {
      const content = '<h1>Hello</h1> <p>world</p>';
      const expected = 'Hello world';
      const encoded = Buffer.from(content).toString('base64url');
      const payload = {
        mimeType: 'text/html',
        body: { data: encoded },
      };
      const result = (service as any).extractBody(payload);
      expect(result).toBe(expected);
    });

    it('should handle recursive parts (prefer plain text)', () => {
      const plainContent = 'Plain content';
      const htmlContent = '<b>HTML content</b>';

      const payload = {
        mimeType: 'multipart/alternative',
        parts: [
          {
            mimeType: 'text/plain',
            body: { data: Buffer.from(plainContent).toString('base64url') },
          },
          {
            mimeType: 'text/html',
            body: { data: Buffer.from(htmlContent).toString('base64url') },
          },
        ],
      };

      // The implementation iterates parts and returns the first one that returns a body.
      // So if text/plain is first, it returns that.
      const result = (service as any).extractBody(payload);
      expect(result).toBe(plainContent);
    });

    it('should handle recursive parts (fallback to HTML)', () => {
      const htmlContent = '<b>HTML only</b>';
      const payload = {
        mimeType: 'multipart/mixed',
        parts: [
          {
            mimeType: 'application/pdf', // Ignored
            body: { attachmentId: '123' },
          },
          {
            mimeType: 'text/html',
            body: { data: Buffer.from(htmlContent).toString('base64url') },
          },
        ],
      };

      const result = (service as any).extractBody(payload);
      expect(result).toBe('HTML only');
    });

    it('should clean email signatures', () => {
      const content = `
Hello there,

--
Sent from my iPhone
`;
      const encoded = Buffer.from(content).toString('base64url');
      const payload = {
        mimeType: 'text/plain',
        body: { data: encoded },
      };
      const result = (service as any).extractBody(payload);
      expect(result.trim()).toBe('Hello there,');
    });

    it('should remove embedded images and long separators', () => {
      const content = `Text [cid:image1.png] more text ____________________ --------------------`;
      const encoded = Buffer.from(content).toString('base64url');
      const payload = {
        mimeType: 'text/plain',
        body: { data: encoded },
      };
      const result = (service as any).extractBody(payload);
      expect(result.trim()).toBe('Text  more text');
    });

    it('should limit body length to 2000 characters', () => {
      const longContent = 'a'.repeat(3000);
      const encoded = Buffer.from(longContent).toString('base64url');
      const payload = {
        mimeType: 'text/plain',
        body: { data: encoded },
      };
      const result = (service as any).extractBody(payload);
      expect(result.length).toBe(2000);
    });
  });

  it('should use configured limit for fetching emails', async () => {
    const userId = 'user-123';
    const limit = 75;

    // Mock config service to return 75 for GMAIL_FETCH_LIMIT
    (configService.get as jest.Mock).mockImplementation((key: string, defaultValue: any) => {
      if (key === 'GMAIL_FETCH_LIMIT') return limit;
      return defaultValue;
    });

    // Mock prisma to return a user
    (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
      id: userId,
      gmailConnected: true,
      accessToken: 'mock-access-token',
    });

    // Mock gmail list response
    gmailClientMock.users.messages.list.mockResolvedValue({
      data: { messages: [] },
    });

    await service.fetchRecentEmails(userId);

    // Verify configService.get was called
    expect(configService.get).toHaveBeenCalledWith('GMAIL_FETCH_LIMIT', 50);

    // Verify gmail list was called with maxResults: 75
    expect(gmailClientMock.users.messages.list).toHaveBeenCalledWith(
      expect.objectContaining({
        maxResults: limit,
      }),
    );
  });

  it('should use default limit (50) if config is missing', async () => {
    const userId = 'user-123';

    // Mock config service to return default value
    (configService.get as jest.Mock).mockImplementation((key: string, defaultValue: any) => defaultValue);

    // Mock prisma to return a user
    (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
      id: userId,
      gmailConnected: true,
      accessToken: 'mock-access-token',
    });

    // Mock gmail list response
    gmailClientMock.users.messages.list.mockResolvedValue({
      data: { messages: [] },
    });

    await service.fetchRecentEmails(userId);

    // Verify gmail list was called with maxResults: 50
    expect(gmailClientMock.users.messages.list).toHaveBeenCalledWith(
      expect.objectContaining({
        maxResults: 50,
      }),
    );
  });

  describe('fetchRecentEmails', () => {
    const userId = 'user-1';
    const user = {
      id: userId,
      gmailConnected: true,
      accessToken: 'access-token',
    };

    it('should fetch emails successfully', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(user);

      const mockListResponse = {
        data: {
          messages: [
            { id: 'msg-1', threadId: 'thread-1' },
          ],
        },
      };

      const mockGetResponse = {
        data: {
          id: 'msg-1',
          threadId: 'thread-1',
          snippet: 'snippet',
          payload: {
            headers: [
              { name: 'From', value: 'Sender <sender@example.com>' },
              { name: 'Subject', value: 'Test Subject' },
              { name: 'Date', value: '2024-01-01T12:00:00Z' },
            ],
            body: { data: Buffer.from('Test Body').toString('base64url') },
            mimeType: 'text/plain',
          },
        },
      };

      gmailClientMock.users.messages.list.mockResolvedValue(mockListResponse);
      gmailClientMock.users.messages.get.mockResolvedValue(mockGetResponse);

      const result = await service.fetchRecentEmails(userId);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({ where: { id: userId } });
      // Adapted matcher to account for possible limit arg (or lack thereof if default)
      expect(gmailClientMock.users.messages.list).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'me',
        q: expect.stringMatching(/after:\d+/),
        // maxResults might be 50 if configService mock returns default
      }));
      expect(gmailClientMock.users.messages.get).toHaveBeenCalledWith({
        userId: 'me',
        id: 'msg-1',
        format: 'full',
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'msg-1',
        subject: 'Test Subject',
        fromEmail: 'sender@example.com',
      });
    });

    it('should throw error if user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.fetchRecentEmails(userId)).rejects.toThrow('User not found');
    });

    it('should throw error if gmail not connected', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({ ...user, gmailConnected: false });

      await expect(service.fetchRecentEmails(userId)).rejects.toThrow('Gmail not connected for user');
    });

    it('should handle API errors when fetching list', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(user);
      gmailClientMock.users.messages.list.mockRejectedValue(new Error('API Error'));

      await expect(service.fetchRecentEmails(userId)).rejects.toThrow('API Error');
    });

    it('should skip email if details fetch fails', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(user);
      const mockListResponse = {
        data: {
          messages: [
            { id: 'msg-1', threadId: 'thread-1' },
            { id: 'msg-2', threadId: 'thread-2' },
          ],
        },
      };

      gmailClientMock.users.messages.list.mockResolvedValue(mockListResponse);

      // First email fails
      gmailClientMock.users.messages.get.mockRejectedValueOnce(new Error('Fetch Error'));

      // Second email succeeds
      const mockGetResponse = {
        data: {
          id: 'msg-2',
          threadId: 'thread-2',
          snippet: 'snippet',
          payload: {
            headers: [
              { name: 'From', value: 'Sender <sender@example.com>' },
              { name: 'Subject', value: 'Test Subject' },
            ],
            body: { data: Buffer.from('Test Body').toString('base64url') },
            mimeType: 'text/plain',
          },
        },
      };
      gmailClientMock.users.messages.get.mockResolvedValueOnce(mockGetResponse);

      const result = await service.fetchRecentEmails(userId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('msg-2');
    });
  });
});
