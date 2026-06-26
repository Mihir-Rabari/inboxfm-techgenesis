import { Test, TestingModule } from '@nestjs/testing';
import { AiService, ProcessedEmail, ScriptSegment, EmailAnalysis } from './ai.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { VoicePersona } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { RawEmail } from '../gmail/gmail.service';

// Mock the module
jest.mock('@google/generative-ai');

describe('AiService', () => {
  let service: AiService;
  let configService: ConfigService;
  let mockGenerateContent: jest.Mock;
  let mockGetGenerativeModel: jest.Mock;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    mockGenerateContent = jest.fn();
    mockGetGenerativeModel = jest.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    });

    (GoogleGenerativeAI as unknown as jest.Mock).mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel,
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-api-key'),
          },
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    configService = module.get<ConfigService>(ConfigService);

    // Mock Logger to prevent console noise during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => { });
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => { });
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeEmails', () => {
    const mockRawEmails: RawEmail[] = [
      {
        id: '1',
        threadId: 't1',
        from: 'sender@example.com',
        fromEmail: 'sender@example.com',
        subject: 'Subject 1',
        snippet: 'Snippet 1',
        body: 'Body 1',
        receivedAt: new Date(),
      },
      {
        id: '2',
        threadId: 't2',
        from: 'sender2@example.com',
        fromEmail: 'sender2@example.com',
        subject: 'Subject 2',
        snippet: 'Snippet 2',
        body: 'Body 2',
        receivedAt: new Date(),
      }
    ];

    const mockAnalysis: EmailAnalysis = {
      category: 'IMPORTANT',
      priority: 90,
      sentiment: 'positive',
      actionRequired: true,
      keyPoints: ['Point'],
      suggestedSummary: 'Summary',
    };

    it('should analyze emails and return processed emails', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify([mockAnalysis, mockAnalysis]),
        },
      });

      const result = await service.analyzeEmails(mockRawEmails);

      expect(result).toHaveLength(2);
      expect(result[0].analysis.priority).toBe(90);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('should handle empty email list', async () => {
      const result = await service.analyzeEmails([]);
      expect(result).toEqual([]);
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it('should batch emails correctly', async () => {
      // Create 7 emails to test batching (batch size is 5)
      const manyEmails = Array(7).fill(mockRawEmails[0]);

      mockGenerateContent
        .mockResolvedValueOnce({
          response: {
            text: () => JSON.stringify(Array(5).fill(mockAnalysis)),
          }
        })
        .mockResolvedValueOnce({
          response: {
            text: () => JSON.stringify(Array(2).fill(mockAnalysis)),
          }
        });

      const result = await service.analyzeEmails(manyEmails);

      expect(result).toHaveLength(7);
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });

    it('should handle API errors by returning default analysis', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Fail'));

      const result = await service.analyzeEmails(mockRawEmails);

      expect(result).toHaveLength(2);
      expect(result[0].analysis.category).toBe('NOISE');
      expect(Logger.prototype.error).toHaveBeenCalled();
    });

    it('should handle invalid JSON response by returning default analysis', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => 'Invalid JSON',
        },
      });

      const result = await service.analyzeEmails(mockRawEmails);

      expect(result).toHaveLength(2);
      expect(result[0].analysis.category).toBe('NOISE');
      expect(Logger.prototype.error).toHaveBeenCalled();
    });
  });

  describe('generateScript', () => {
    const mockEmails: ProcessedEmail[] = [
      {
        id: '1',
        threadId: 't1',
        from: 'Sender <sender@example.com>',
        fromEmail: 'sender@example.com',
        subject: 'Test Subject',
        snippet: 'Test snippet',
        body: 'Test body',
        receivedAt: new Date(),
        analysis: {
          category: 'IMPORTANT',
          priority: 80,
          sentiment: 'positive',
          actionRequired: true,
          keyPoints: ['Point 1'],
          suggestedSummary: 'Summary of the email',
        },
      },
    ];

    it('should generate script segments successfully', async () => {
      const mockScript: ScriptSegment[] = [
        { type: 'intro', text: 'Hello', emphasis: 'medium' },
        { type: 'email', text: 'Email content', emphasis: 'high' },
        { type: 'outro', text: 'Goodbye', emphasis: 'low' },
      ];

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockScript),
        },
      });

      const result = await service.generateScript(mockEmails, VoicePersona.NEWSROOM);

      expect(result).toEqual(mockScript);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);

      const callArgs = mockGenerateContent.mock.calls[0][0];
      const prompt = callArgs.contents[0].parts[0].text;
      expect(prompt).toContain('Create an audio briefing script');
      expect(prompt).toContain('User name: there');
    });

    it('should use custom prompt and user name', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => '[]',
        },
      });

      await service.generateScript(
        mockEmails,
        VoicePersona.FRIEND,
        'Alice',
        'Be very sarcastic'
      );

      const callArgs = mockGenerateContent.mock.calls[0][0];
      const prompt = callArgs.contents[0].parts[0].text;

      expect(prompt).toContain('Custom style: Be very sarcastic');
      expect(prompt).toContain('User name: Alice');
    });

    it('should use default persona style when no custom prompt is provided', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => '[]',
        },
      });

      await service.generateScript(mockEmails, VoicePersona.SPEEDSTER);

      const callArgs = mockGenerateContent.mock.calls[0][0];
      const prompt = callArgs.contents[0].parts[0].text;

      expect(prompt).toContain('Style: Fast-paced. Action-oriented, bullet-point style.');
    });

    it('should return fallback script when AI generation fails', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      const result = await service.generateScript(mockEmails, VoicePersona.NEWSROOM);

      expect(result).toBeDefined();
      expect(result[0].type).toBe('intro');
      expect(result[0].text).toContain("Good morning. Here's your inbox briefing.");
      expect(Logger.prototype.error).toHaveBeenCalled();
    });

    it('should return fallback script when AI returns invalid JSON', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => 'Invalid JSON',
        },
      });

      const result = await service.generateScript(mockEmails, VoicePersona.NEWSROOM);

      expect(result).toBeDefined();
      expect(result[0].type).toBe('intro');
      expect(Logger.prototype.error).toHaveBeenCalled();
    });
  });
});
