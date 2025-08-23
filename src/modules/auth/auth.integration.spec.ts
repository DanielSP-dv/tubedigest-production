import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenManagementService } from './token-management.service';
import { SessionTokenService } from '../security/session-token.service';
import { SecurityMiddleware } from '../security/security.middleware';

// Mock the Google OAuth service to prevent real API calls
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    getToken: jest.fn().mockRejectedValue(new Error('Invalid code')),
    getUserInfo: jest.fn().mockResolvedValue({ email: 'test@example.com' }),
    generateAuthUrl: jest.fn().mockReturnValue('https://accounts.google.com/oauth2/auth?client_id=test&redirect_uri=test')
  }))
}));

describe('Auth Integration', () => {
  let app: INestApplication;
  let authService: AuthService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: TokenManagementService,
          useValue: {
            getUserConnections: jest.fn(),
            refreshToken: jest.fn(),
            revokeConnection: jest.fn(),
            getValidAccessToken: jest.fn(),
          },
        },
        {
          provide: SessionTokenService,
          useValue: {
            generateSessionToken: jest.fn(),
            validateSessionToken: jest.fn(),
            refreshSessionToken: jest.fn(),
            invalidateSessionToken: jest.fn(),
          },
        },
        {
          provide: SecurityMiddleware,
          useValue: {
            use: jest.fn(),
            checkRateLimit: jest.fn(),
            validateCSRFToken: jest.fn(),
            generateCSRFToken: jest.fn(),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    authService = moduleFixture.get<AuthService>(AuthService);
    await app.init();
  }, 15000); // Increase timeout

  afterEach(async () => {
    await app.close();
  }, 10000); // Increase timeout

  describe('GET /auth/google', () => {
    it('should redirect to Google OAuth URL', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/google')
        .expect(302); // Redirect status

      expect(response.header.location).toContain('accounts.google.com');
      expect(response.header.location).toContain('oauth2');
    });
  });

  describe('GET /auth/google/callback', () => {
    it('should handle missing code parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/google/callback')
        .expect(302); // Should redirect to frontend with error

      expect(response.header.location).toContain('auth=error');
    }, 15000); // Increase timeout further

    it('should handle invalid code parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/google/callback?code=invalid_code')
        .expect(302); // Should redirect to frontend with error

      expect(response.header.location).toContain('auth=error');
    }, 15000); // Increase timeout further
  });

  describe('GET /auth/logout', () => {
    it('should redirect to frontend after logout', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/logout')
        .expect(302);

      expect(response.header.location).toContain('localhost:3000'); // Frontend URL
    });
  });
});
