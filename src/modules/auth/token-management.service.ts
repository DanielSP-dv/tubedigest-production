import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import * as crypto from 'crypto';

export interface OAuthConnection {
  id: string;
  provider: string;
  isActive: boolean;
  createdAt: Date;
  lastRefreshed: Date;
  expiresAt: Date;
}

export interface TokenRefreshResult {
  success: boolean;
  newExpiry?: Date;
  error?: string;
}

@Injectable()
export class TokenManagementService {
  private readonly logger = new Logger(TokenManagementService.name);
  private readonly encKey: Buffer;
  private readonly oauthClient: OAuth2Client;

  constructor(private readonly prisma: PrismaClient) {
    // Enhanced encryption key handling
    const key = process.env.TOKEN_ENC_KEY || crypto.createHash('sha256').update('dev-key').digest('hex');
    this.encKey = Buffer.from(key.slice(0, 64), 'hex');
    
    // OAuth client for token refresh
    const clientId = process.env.GOOGLE_CLIENT_ID || '';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    this.oauthClient = new OAuth2Client({ clientId, clientSecret });
  }

  /**
   * Encrypt sensitive data using AES-256-GCM
   */
  private encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encKey, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
  }

  /**
   * Decrypt sensitive data using AES-256-GCM
   */
  private decrypt(encryptedData: string): string {
    const data = Buffer.from(encryptedData, 'base64');
    const iv = data.subarray(0, 12);
    const tag = data.subarray(12, 28);
    const encrypted = data.subarray(28);
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encKey, iv);
    decipher.setAuthTag(tag);
    
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  }

  /**
   * Get user's OAuth connections
   */
  async getUserConnections(userId: string): Promise<OAuthConnection[]> {
    try {
      const tokens = await this.prisma.oAuthToken.findMany({
        where: { userId },
        select: {
          id: true,
          provider: true,
          expiryDate: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return tokens.map(token => ({
        id: token.id,
        provider: token.provider,
        isActive: token.expiryDate ? token.expiryDate > new Date() : false,
        createdAt: token.createdAt,
        lastRefreshed: token.updatedAt,
        expiresAt: token.expiryDate || new Date(),
      }));
    } catch (error) {
      this.logger.error(`Failed to get user connections for ${userId}:`, error);
      throw new Error('Failed to retrieve OAuth connections');
    }
  }

  /**
   * Refresh OAuth token automatically
   */
  async refreshToken(tokenId: string): Promise<TokenRefreshResult> {
    try {
      const token = await this.prisma.oAuthToken.findUnique({
        where: { id: tokenId },
      });

      if (!token || !token.refreshTokenEnc) {
        return { success: false, error: 'Token not found or no refresh token available' };
      }

      // Decrypt refresh token
      const refreshToken = this.decrypt(token.refreshTokenEnc);
      
      // Refresh the token
      this.oauthClient.setCredentials({ refresh_token: refreshToken });
      const { credentials } = await this.oauthClient.refreshAccessToken();
      
      if (!credentials.access_token || !credentials.expiry_date) {
        return { success: false, error: 'Failed to refresh token' };
      }

      // Encrypt and store new tokens
      const accessTokenEnc = this.encrypt(credentials.access_token);
      const refreshTokenEnc = credentials.refresh_token ? this.encrypt(credentials.refresh_token) : token.refreshTokenEnc;
      const expiryDate = new Date(credentials.expiry_date);

      await this.prisma.oAuthToken.update({
        where: { id: tokenId },
        data: {
          accessTokenEnc,
          refreshTokenEnc,
          expiryDate,
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Successfully refreshed token ${tokenId}`);
      return { success: true, newExpiry: expiryDate };
    } catch (error) {
      this.logger.error(`Failed to refresh token ${tokenId}:`, error);
      return { success: false, error: 'Token refresh failed' };
    }
  }

  /**
   * Revoke OAuth connection
   */
  async revokeConnection(tokenId: string, userId: string): Promise<boolean> {
    try {
      const token = await this.prisma.oAuthToken.findFirst({
        where: { id: tokenId, userId },
      });

      if (!token) {
        throw new Error('Token not found or access denied');
      }

      // Attempt to revoke on Google's side if we have a valid token
      if (token.accessTokenEnc) {
        try {
          const accessToken = this.decrypt(token.accessTokenEnc);
          await this.oauthClient.revokeToken(accessToken);
        } catch (revokeError) {
          this.logger.warn(`Failed to revoke token on Google's side: ${revokeError}`);
          // Continue with local deletion even if Google revocation fails
        }
      }

      // Delete from database
      await this.prisma.oAuthToken.delete({
        where: { id: tokenId },
      });

      this.logger.log(`Successfully revoked connection ${tokenId} for user ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to revoke connection ${tokenId}:`, error);
      throw new Error('Failed to revoke OAuth connection');
    }
  }

  /**
   * Get valid access token with automatic refresh
   */
  async getValidAccessToken(tokenId: string): Promise<string | null> {
    try {
      const token = await this.prisma.oAuthToken.findUnique({
        where: { id: tokenId },
      });

      if (!token) {
        return null;
      }

      // Check if token is expired or will expire soon (within 5 minutes)
      const now = new Date();
      const expiresSoon = token.expiryDate && token.expiryDate.getTime() - now.getTime() < 5 * 60 * 1000;

      if (!token.expiryDate || expiresSoon) {
        // Token is expired or expiring soon, try to refresh
        const refreshResult = await this.refreshToken(tokenId);
        if (!refreshResult.success) {
          return null;
        }
        
        // Get the updated token
        const updatedToken = await this.prisma.oAuthToken.findUnique({
          where: { id: tokenId },
        });
        
        if (!updatedToken) {
          return null;
        }
        
        return this.decrypt(updatedToken.accessTokenEnc);
      }

      // Token is still valid
      return this.decrypt(token.accessTokenEnc);
    } catch (error) {
      this.logger.error(`Failed to get valid access token for ${tokenId}:`, error);
      return null;
    }
  }

  /**
   * Check if token needs refresh
   */
  async needsRefresh(tokenId: string): Promise<boolean> {
    try {
      const token = await this.prisma.oAuthToken.findUnique({
        where: { id: tokenId },
      });

      if (!token || !token.expiryDate) {
        return false;
      }

      // Check if token expires within 5 minutes
      const now = new Date();
      return token.expiryDate.getTime() - now.getTime() < 5 * 60 * 1000;
    } catch (error) {
      this.logger.error(`Failed to check refresh status for ${tokenId}:`, error);
      return false;
    }
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await this.prisma.oAuthToken.deleteMany({
        where: {
          expiryDate: {
            lt: new Date(),
          },
        },
      });

      this.logger.log(`Cleaned up ${result.count} expired tokens`);
      return result.count;
    } catch (error) {
      this.logger.error('Failed to cleanup expired tokens:', error);
      return 0;
    }
  }
}
