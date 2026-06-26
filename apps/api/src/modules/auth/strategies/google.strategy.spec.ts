import { Test, TestingModule } from '@nestjs/testing';
import { GoogleStrategy } from './google.strategy';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;
  let authService: AuthService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'GOOGLE_CLIENT_ID': return 'mock-client-id';
        case 'GOOGLE_CLIENT_SECRET': return 'mock-client-secret';
        case 'GOOGLE_CALLBACK_URL': return 'http://localhost/callback';
        default: return null;
      }
    }),
  };

  const mockAuthService = {
    validateOauthTicket: jest.fn(),
    getUserById: jest.fn(),
    connectGmail: jest.fn(),
    handleDirectGoogleLogin: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleStrategy,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    strategy = module.get<GoogleStrategy>(GoogleStrategy);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    const mockRequest = {
      query: { state: 'mock-state' },
      headers: { cookie: 'oauth_nonce=mock-nonce' },
    } as unknown as Request;

    const mockProfile = {
      id: 'google-id',
      displayName: 'Test User',
      emails: [{ value: 'test@example.com' }],
      photos: [{ value: 'http://picture.url' }],
      provider: 'google',
    } as any;

    const mockUser = {
      id: 'user-id',
      email: 'test@example.com',
    };

    it('should validate ticket, fetch user, and connect gmail', async () => {
      mockAuthService.validateOauthTicket.mockResolvedValue('user-id');
      mockAuthService.getUserById.mockResolvedValue(mockUser);
      mockAuthService.connectGmail.mockResolvedValue({ ...mockUser, gmailConnected: true });
      const done = jest.fn();

      await strategy.validate(
        mockRequest,
        'access-token',
        'refresh-token',
        mockProfile,
        done
      );

      expect(mockAuthService.validateOauthTicket).toHaveBeenCalledWith('mock-state', 'mock-nonce');
      expect(mockAuthService.getUserById).toHaveBeenCalledWith('user-id');
      expect(mockAuthService.connectGmail).toHaveBeenCalledWith(mockUser, expect.objectContaining({
        id: 'google-id',
        email: 'test@example.com',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }));
      expect(done).toHaveBeenCalledWith(null, expect.anything());
    });

    it('should throw UnauthorizedException if ticket is invalid', async () => {
      mockAuthService.validateOauthTicket.mockRejectedValue(new Error('Invalid ticket'));
      const done = jest.fn();

      await expect(strategy.validate(
        mockRequest,
        'access-token',
        'refresh-token',
        mockProfile,
        done
      )).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockAuthService.validateOauthTicket.mockResolvedValue('user-id');
      mockAuthService.getUserById.mockResolvedValue(null);
      const done = jest.fn();

      await expect(strategy.validate(
        mockRequest,
        'access-token',
        'refresh-token',
        mockProfile,
        done
      )).rejects.toThrow(UnauthorizedException);
    });

    it('should call handleDirectGoogleLogin if state is missing (direct login)', async () => {
        const req = { query: {}, headers: {} } as unknown as Request;
        const done = jest.fn();
        const mockResult = { user: { id: '1' }, token: 'mock' };
        (authService.handleDirectGoogleLogin as jest.Mock).mockResolvedValueOnce(mockResult);

        await strategy.validate(req, 'token', 'refresh', mockProfile, done);

        expect(authService.handleDirectGoogleLogin).toHaveBeenCalled();
        expect(done).toHaveBeenCalledWith(null, mockResult);
    });

    it('should throw UnauthorizedException if nonce is missing', async () => {
        const req = { query: { state: 'state' }, headers: {} } as unknown as Request;
        const done = jest.fn();
        await expect(strategy.validate(req, 'token', 'refresh', mockProfile, done)).rejects.toThrow(UnauthorizedException);
    });
  });
});
