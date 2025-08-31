import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

export interface SessionTokenPayload {
  userId: string;
  email: string;
  sessionId: string;
  issuedAt: number;
  expiresAt: number;
  ip: string;
  userAgent: string;
}

export interface SessionTokenResult {
  token: string;
  expiresAt: Date;
  sessionId: string;
}

@Injectable()
export class SessionTokenService {
  private readonly logger = new Logger(SessionTokenService.name);
  private readonly secretKey: string;
  private readonly algorithm = 'HS256';
  private readonly tokenExpiry = 24 * 60 * 60; // 24 hours in seconds

  constructor() {
    // Get secret key from environment or generate a secure one
    this.secretKey = process.env.SESSION_SECRET_KEY || 
      crypto.randomBytes(64).toString('hex');
    
    if (!process.env.SESSION_SECRET_KEY) {
      this.logger.warn('SESSION_SECRET_KEY not set, using generated key. Set this in production!');
    }
  }

  /**
   * Generate a cryptographically signed session token
   */
  generateSessionToken(
    userId: string,
    email: string,
    ip: string,
    userAgent: string,
  ): SessionTokenResult {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + this.tokenExpiry;

    const payload: SessionTokenPayload = {
      userId,
      email,
      sessionId,
      issuedAt,
      expiresAt,
      ip,
      userAgent,
    };

    // Sign the token with HMAC-SHA256
    const token = jwt.sign(payload, this.secretKey, {
      algorithm: this.algorithm,
      expiresIn: this.tokenExpiry,
    });

    this.logger.log(`Generated session token for user ${userId}, session ${sessionId}`);

    return {
      token,
      expiresAt: new Date(expiresAt * 1000),
      sessionId,
    };
  }

  /**
   * Validate and decode a session token
   */
  validateSessionToken(token: string): SessionTokenPayload | null {
    try {
      // Verify the token signature and decode
      const decoded = jwt.verify(token, this.secretKey, {
        algorithms: [this.algorithm],
      }) as SessionTokenPayload;

      // Additional validation
      if (!this.isValidPayload(decoded)) {
        this.logger.warn('Invalid token payload structure');
        return null;
      }

      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (decoded.expiresAt < now) {
        this.logger.warn(`Token expired for session ${decoded.sessionId}`);
        return null;
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        this.logger.warn(`JWT validation failed: ${error.message}`);
      } else if (error instanceof jwt.TokenExpiredError) {
        this.logger.warn(`Token expired: ${error.message}`);
      } else if (error instanceof Error) {
        this.logger.error(`Token validation error: ${error.message}`);
      } else {
        this.logger.error('An unknown error occurred during token validation');
      }
      return null;
    }
  }

  /**
   * Refresh a session token
   */
  refreshSessionToken(token: string, ip: string, userAgent: string): SessionTokenResult | null {
    const payload = this.validateSessionToken(token);
    if (!payload) {
      return null;
    }

    // Generate new token with updated metadata
    return this.generateSessionToken(
      payload.userId,
      payload.email,
      ip,
      userAgent,
    );
  }

  /**
   * Invalidate a session token (for logout)
   */
  invalidateSessionToken(token: string): boolean {
    try {
      const payload = this.validateSessionToken(token);
      if (!payload) {
        return false;
      }

      // In a production environment, you would add the token to a blacklist
      // or use Redis to track invalidated tokens
      this.logger.log(`Invalidated session token for user ${payload.userId}, session ${payload.sessionId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to invalidate token: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Get session information from token
   */
  getSessionInfo(token: string): Partial<SessionTokenPayload> | null {
    const payload = this.validateSessionToken(token);
    if (!payload) {
      return null;
    }

    // Return only safe information (exclude sensitive data)
    return {
      userId: payload.userId,
      email: payload.email,
      sessionId: payload.sessionId,
      issuedAt: payload.issuedAt,
      expiresAt: payload.expiresAt,
    };
  }

  /**
   * Check if token is about to expire (within 1 hour)
   */
  isTokenExpiringSoon(token: string): boolean {
    const payload = this.validateSessionToken(token);
    if (!payload) {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    const oneHour = 60 * 60;
    return (payload.expiresAt - now) < oneHour;
  }

  /**
   * Validate token payload structure
   */
  private isValidPayload(payload: any): payload is SessionTokenPayload {
    return (
      typeof payload === 'object' &&
      typeof payload.userId === 'string' &&
      typeof payload.email === 'string' &&
      typeof payload.sessionId === 'string' &&
      typeof payload.issuedAt === 'number' &&
      typeof payload.expiresAt === 'number' &&
      typeof payload.ip === 'string' &&
      typeof payload.userAgent === 'string'
    );
  }

  /**
   * Generate a secure random session ID
   */
  generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Get token expiry time in seconds
   */
  getTokenExpiry(): number {
    return this.tokenExpiry;
  }
}
