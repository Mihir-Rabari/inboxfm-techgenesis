import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { AuthGuard } from '@nestjs/passport';

describe('AuthController Rate Limiting', () => {
  let app: INestApplication;

  const mockAuthService = {
    login: jest.fn().mockResolvedValue({
      user: { id: '1', email: 'test@example.com', name: 'Test', picture: '', gmailConnected: false },
      token: 'mock-token'
    }),
    signup: jest.fn().mockResolvedValue({
      user: { id: '1', email: 'test@example.com', name: 'Test', gmailConnected: false },
      token: 'mock-token'
    }),
    requestPasswordReset: jest.fn().mockResolvedValue(true),
    resetPassword: jest.fn().mockResolvedValue(true),
    checkIsAdmin: jest.fn().mockResolvedValue(false),
    unsubscribe: jest.fn().mockResolvedValue({ success: true }),
    verifyUnsubscribeToken: jest.fn().mockResolvedValue({ success: true }),
    updateEmailPreferences: jest.fn().mockResolvedValue({ success: true }),
  };

  const mockConfigService = {
    get: jest.fn((key, defaultVal) => defaultVal),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            name: 'default',
            ttl: 60000,
            limit: 100, // Global limit high to prove controller limit works
          },
        ]),
      ],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .overrideGuard(AuthGuard('google'))
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should limit login requests to 5 per minute', async () => {
    // Make 5 requests (should be allowed)
    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password' })
        .expect(200);
    }

    // 6th request should fail with 429
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' })
      .expect(429);
  });

  it('should limit password reset requests to 3 per minute', async () => {
    // Make 3 requests (should be allowed)
    for (let i = 0; i < 3; i++) {
      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'test@example.com' })
        .expect(200);
    }

    // 4th request should fail with 429
    await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: 'test@example.com' })
      .expect(429);
  });
});
