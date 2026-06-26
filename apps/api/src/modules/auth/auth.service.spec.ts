import { Test, TestingModule } from '@nestjs/testing';
import { AuthService, GoogleProfile } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { SummaryService } from '../summary/summary.service';
import { MailService } from '../mail/mail.service';
import { EncryptionUtil } from '../../utils/encryption.util';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { User } from '@prisma/client';
import { BadRequestException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let loggerErrorSpy: jest.SpyInstance;
  let eventEmitter: EventEmitter2;

  const mockUser: User = {
    id: 'user-id',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed-password',
    isActive: true,
    gmailConnected: false,
    googleId: null,
    accessToken: null,
    refreshToken: null,
    tokenExpiry: null,
    picture: null,
    timezone: 'UTC',
    lastActiveAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    resetToken: null,
    resetTokenExpires: null,
    styleProfile: null,
    googleConnectedAt: null,
    googleWarningSent: false,
    subscribePromo: true,
    subscribeAlerts: true,
    onboardingComplete: false,
    onboardingStep: 0,
  };

  const mockGoogleProfile: GoogleProfile = {
    id: 'google-id',
    email: 'test@example.com',
    displayName: 'Test User',
    picture: 'http://picture.url',
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    waitlist: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    admin: {
      findUnique: jest.fn(),
    },
    summarySchedule: {
      updateMany: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
    verify: jest.fn(),
  };

  const mockSummaryService = {
    createDefaultSummary: jest.fn(),
  };

  const mockMailService = {
    sendWelcomeEmail: jest.fn(),
    sendLoginAlert: jest.fn(),
    sendPasswordReset: jest.fn(),
  };

  const mockEncryptionUtil = {
    encrypt: jest.fn((val) => `encrypted-${val}`),
    decrypt: jest.fn((val) => val.replace('encrypted-', '')),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: SummaryService, useValue: mockSummaryService },
        { provide: MailService, useValue: mockMailService },
        { provide: EncryptionUtil, useValue: mockEncryptionUtil },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);

    // Spy on Logger
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => { });
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => { });

    // Mock bcrypt
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('connectGmail', () => {
    it('should connect gmail for existing user', async () => {
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        gmailConnected: true,
        googleId: mockGoogleProfile.id,
      });

      const result = await service.connectGmail(mockUser, mockGoogleProfile);

      expect(mockPrismaService.user.update).toHaveBeenCalled();
      expect(result.gmailConnected).toBe(true);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('auth.gmailConnected', expect.anything());
    });

    it('should throw BadRequestException if email mismatch', async () => {
      const profileWithDifferentEmail = { ...mockGoogleProfile, email: 'different@example.com' };
      await expect(service.connectGmail(mockUser, profileWithDifferentEmail)).rejects.toThrow(BadRequestException);
    });
  });

  describe('handleGoogleCallback', () => {
    it('should find user and connect gmail', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      const connectGmailSpy = jest.spyOn(service, 'connectGmail').mockResolvedValue({
        ...mockUser,
        gmailConnected: true,
      });

      await service.handleGoogleCallback(mockGoogleProfile);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({ where: { email: mockGoogleProfile.email } });
      expect(connectGmailSpy).toHaveBeenCalledWith(mockUser, mockGoogleProfile);
    });
  });

  describe('signup', () => {
    it('should hash password and create user', async () => {
      const signupData = {
        email: 'test@example.com',
        password: 'password123',
        accessCode: 'valid-code',
        name: 'Test User',
      };

      const mockAccessCode = {
        id: 'code-id',
        code: 'valid-code',
        isUsed: false,
        expiresAt: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.waitlist.findFirst.mockResolvedValue({
        id: 'waitlist-id',
        email: 'test@example.com',
        accessCode: 'valid-code',
        status: 'APPROVED',
      });
      mockPrismaService.waitlist.update.mockResolvedValue({ id: 'waitlist-id' });
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      await service.signup(signupData);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          password: 'hashed-password',
        }),
      }));
    });
  });

  describe('requestPasswordReset', () => {
    it('should hash the reset token before storing it', async () => {
      const email = 'test@example.com';
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await service.requestPasswordReset(email);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('auth.passwordReset', expect.anything());
      const eventPayload = mockEventEmitter.emit.mock.calls[0][1];
      const sentToken = eventPayload.token;

      const expectedHash = crypto.createHash('sha256').update(sentToken).digest('hex');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          resetToken: expectedHash,
        }),
      }));
    });
  });

  describe('resetPassword', () => {
    it('should verify hashed token and update password', async () => {
      const plainToken = 'reset-token';
      const newPassword = 'new-password';
      const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');

      const userWithToken = {
        ...mockUser,
        resetToken: hashedToken,
        resetTokenExpires: new Date(Date.now() + 3600000),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(userWithToken);

      await service.resetPassword(plainToken, newPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 12);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          password: 'hashed-password',
          resetToken: null,
        }),
      }));
    });
  });

  describe('verifyUnsubscribeToken', () => {
    it('should return registered user preferences if user exists', async () => {
      const token = 'unsubscribe-token';
      mockJwtService.verify.mockReturnValueOnce({ email: 'test@example.com' });
      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);

      const result = await service.verifyUnsubscribeToken(token);

      expect(result).toEqual({
        success: true,
        type: 'registered',
        email: 'test@example.com',
        preferences: {
          subscribePromo: true,
          subscribeDailyBrief: true,
          subscribeAlerts: true,
        },
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
    });

    it('should return waitlist type if no user but waitlist entry exists', async () => {
      const token = 'unsubscribe-token';
      mockJwtService.verify.mockReturnValueOnce({ email: 'test@example.com' });
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.waitlist.findUnique.mockResolvedValueOnce({
        id: 'waitlist-123',
        email: 'test@example.com',
        status: 'PENDING',
      });

      const result = await service.verifyUnsubscribeToken(token);

      expect(result).toEqual({
        success: true,
        type: 'waitlist',
        email: 'test@example.com',
        status: 'PENDING',
      });
      expect(mockPrismaService.waitlist.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
    });
  });

  describe('updateEmailPreferences', () => {
    it('should update waitlist status to REJECTED on waitlist optout', async () => {
      const token = 'unsubscribe-token';
      mockJwtService.verify.mockReturnValueOnce({ email: 'test@example.com' });
      mockPrismaService.waitlist.findUnique.mockResolvedValueOnce({
        id: 'waitlist-123',
        email: 'test@example.com',
      });
      mockPrismaService.waitlist.update.mockResolvedValueOnce({ id: 'waitlist-123' });

      const result = await service.updateEmailPreferences(token, { optOutWaitlist: true });

      expect(result.success).toBe(true);
      expect(mockPrismaService.waitlist.update).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        data: expect.objectContaining({ status: 'REJECTED' }),
      });
    });

    it('should update registered user preferences', async () => {
      const token = 'unsubscribe-token';
      mockJwtService.verify.mockReturnValueOnce({ email: 'test@example.com' });
      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);
      mockPrismaService.user.update.mockResolvedValueOnce(mockUser);
      mockPrismaService.summarySchedule.updateMany.mockResolvedValueOnce({ count: 1 });

      const result = await service.updateEmailPreferences(token, {
        subscribePromo: false,
        subscribeDailyBrief: false,
        subscribeAlerts: false,
      });

      expect(result.success).toBe(true);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        data: expect.objectContaining({
          subscribePromo: false,
          subscribeAlerts: false,
          isActive: false,
        }),
      });
      expect(mockPrismaService.summarySchedule.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-id' },
        data: { isActive: false },
      });
    });
  });
});
