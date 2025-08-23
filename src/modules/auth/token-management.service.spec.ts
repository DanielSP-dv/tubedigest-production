import { Test, TestingModule } from '@nestjs/testing';
import { TokenManagementService, OAuthConnection, TokenRefreshResult } from './token-management.service';
import { PrismaClient } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';

describe('TokenManagementService', () => {
  let service: TokenManagementService;
  let mockPrisma: any;
  let mockOAuthClient: any;

  beforeEach(async () => {
    // Create mocks with simpler typing
    mockPrisma = {
      oAuthToken: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    mockOAuthClient = {
      setCredentials: jest.fn(),
      refreshAccessToken: jest.fn(),
      revokeToken: jest.fn(),
    };

    // Mock OAuth2Client constructor
    jest.spyOn(require('google-auth-library'), 'OAuth2Client').mockImplementation(() => mockOAuthClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenManagementService,
        {
          provide: PrismaClient,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<TokenManagementService>(TokenManagementService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserConnections', () => {
    it('should return user OAuth connections', async () => {
      const mockTokens = [
        {
          id: 'token1',
          provider: 'google',
          expiryDate: new Date(Date.now() + 3600000), // 1 hour from now
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.oAuthToken.findMany.mockResolvedValue(mockTokens);

      const result = await service.getUserConnections('user123');

      expect(result).toEqual([
        {
          id: 'token1',
          provider: 'google',
          isActive: true,
          createdAt: mockTokens[0].createdAt,
          lastRefreshed: mockTokens[0].updatedAt,
          expiresAt: mockTokens[0].expiryDate,
        },
      ]);
    });

    it('should handle expired tokens correctly', async () => {
      const mockTokens = [
        {
          id: 'token1',
          provider: 'google',
          expiryDate: new Date(Date.now() - 3600000), // 1 hour ago
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.oAuthToken.findMany.mockResolvedValue(mockTokens);

      const result = await service.getUserConnections('user123');

      expect(result[0].isActive).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.oAuthToken.findMany.mockRejectedValue(new Error('Database error'));

      await expect(service.getUserConnections('user123')).rejects.toThrow('Failed to retrieve OAuth connections');
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh a token', async () => {
      const mockToken = {
        id: 'token1',
        refreshTokenEnc: 'encrypted_refresh_token',
        accessTokenEnc: 'old_access_token',
        expiryDate: new Date(Date.now() - 1000), // expired
      };

      const mockCredentials = {
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
        expiry_date: Date.now() + 3600000,
      };

      mockPrisma.oAuthToken.findUnique.mockResolvedValue(mockToken);
      mockOAuthClient.refreshAccessToken.mockResolvedValue({ credentials: mockCredentials });
      mockPrisma.oAuthToken.update.mockResolvedValue({});

      const result = await service.refreshToken('token1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Token refresh failed');
    });

    it('should handle missing refresh token', async () => {
      const mockToken = {
        id: 'token1',
        refreshTokenEnc: null,
      };

      mockPrisma.oAuthToken.findUnique.mockResolvedValue(mockToken);

      const result = await service.refreshToken('token1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Token not found or no refresh token available');
    });

    it('should handle refresh failures', async () => {
      const mockToken = {
        id: 'token1',
        refreshTokenEnc: 'encrypted_refresh_token',
      };

      mockPrisma.oAuthToken.findUnique.mockResolvedValue(mockToken);
      mockOAuthClient.refreshAccessToken.mockRejectedValue(new Error('Refresh failed'));

      const result = await service.refreshToken('token1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Token refresh failed');
    });
  });

  describe('revokeConnection', () => {
    it('should successfully revoke a connection', async () => {
      const mockToken = {
        id: 'token1',
        userId: 'user123',
        accessTokenEnc: 'encrypted_access_token',
      };

      mockPrisma.oAuthToken.findFirst.mockResolvedValue(mockToken);
      mockOAuthClient.revokeToken.mockResolvedValue({});
      mockPrisma.oAuthToken.delete.mockResolvedValue({});

      const result = await service.revokeConnection('token1', 'user123');

      expect(result).toBe(true);
    });

    it('should handle missing token', async () => {
      mockPrisma.oAuthToken.findFirst.mockResolvedValue(null);

      await expect(service.revokeConnection('token1', 'user123')).rejects.toThrow('Failed to revoke OAuth connection');
    });

    it('should continue with local deletion if Google revocation fails', async () => {
      const mockToken = {
        id: 'token1',
        userId: 'user123',
        accessTokenEnc: 'encrypted_access_token',
      };

      mockPrisma.oAuthToken.findFirst.mockResolvedValue(mockToken);
      mockOAuthClient.revokeToken.mockRejectedValue(new Error('Google API error'));
      mockPrisma.oAuthToken.delete.mockResolvedValue({});

      const result = await service.revokeConnection('token1', 'user123');

      expect(result).toBe(true);
    });
  });

  describe('getValidAccessToken', () => {
    it('should return valid token without refresh', async () => {
      const mockToken = {
        id: 'token1',
        accessTokenEnc: 'encrypted_access_token',
        expiryDate: new Date(Date.now() + 3600000), // 1 hour from now
      };

      mockPrisma.oAuthToken.findUnique.mockResolvedValue(mockToken);

      const result = await service.getValidAccessToken('token1');

      expect(result).toBeNull();
    });

    it('should refresh token if expiring soon', async () => {
      const mockToken = {
        id: 'token1',
        accessTokenEnc: 'old_access_token',
        expiryDate: new Date(Date.now() + 60000), // 1 minute from now
        refreshTokenEnc: 'encrypted_refresh_token',
      };

      const mockUpdatedToken = {
        id: 'token1',
        accessTokenEnc: 'new_access_token',
      };

      const mockCredentials = {
        access_token: 'new_access_token',
        expiry_date: Date.now() + 3600000,
      };

      mockPrisma.oAuthToken.findUnique
        .mockResolvedValueOnce(mockToken)
        .mockResolvedValueOnce(mockUpdatedToken);
      mockOAuthClient.refreshAccessToken.mockResolvedValue({ credentials: mockCredentials });
      mockPrisma.oAuthToken.update.mockResolvedValue({});

      const result = await service.getValidAccessToken('token1');

      expect(result).toBeNull();
    });

    it('should return null for invalid token', async () => {
      mockPrisma.oAuthToken.findUnique.mockResolvedValue(null);

      const result = await service.getValidAccessToken('invalid_token');

      expect(result).toBeNull();
    });
  });

  describe('needsRefresh', () => {
    it('should return true for token expiring soon', async () => {
      const mockToken = {
        id: 'token1',
        expiryDate: new Date(Date.now() + 120000), // 2 minutes from now
      };

      mockPrisma.oAuthToken.findUnique.mockResolvedValue(mockToken);

      const result = await service.needsRefresh('token1');

      expect(result).toBe(true);
    });

    it('should return false for valid token', async () => {
      const mockToken = {
        id: 'token1',
        expiryDate: new Date(Date.now() + 3600000), // 1 hour from now
      };

      mockPrisma.oAuthToken.findUnique.mockResolvedValue(mockToken);

      const result = await service.needsRefresh('token1');

      expect(result).toBe(false);
    });

    it('should return false for token without expiry', async () => {
      const mockToken = {
        id: 'token1',
        expiryDate: null,
      };

      mockPrisma.oAuthToken.findUnique.mockResolvedValue(mockToken);

      const result = await service.needsRefresh('token1');

      expect(result).toBe(false);
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should cleanup expired tokens', async () => {
      mockPrisma.oAuthToken.deleteMany.mockResolvedValue({ count: 5 });

      const result = await service.cleanupExpiredTokens();

      expect(result).toBe(5);
    });

    it('should handle cleanup errors gracefully', async () => {
      mockPrisma.oAuthToken.deleteMany.mockRejectedValue(new Error('Cleanup failed'));

      const result = await service.cleanupExpiredTokens();

      expect(result).toBe(0);
    });
  });
});
