import { Injectable } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly client: OAuth2Client;
  private readonly prisma = new PrismaClient();
  private readonly encKey: Buffer;

  constructor() {
    const clientId = process.env.GOOGLE_CLIENT_ID || '';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://frontend-rho-topaz-86.vercel.app/auth/google/callback';
    this.client = new OAuth2Client({ clientId, clientSecret, redirectUri });
    // Simple AES-256-GCM key from env (32 bytes hex or base64 recommended)
    const key = process.env.TOKEN_ENC_KEY || crypto.createHash('sha256').update('dev-key').digest('hex');
    this.encKey = Buffer.from(key.slice(0, 64), 'hex');
  }

  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/youtube.readonly',
      'openid',
      'email',
      'profile',
    ];
    return this.client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      include_granted_scopes: true,
      prompt: 'consent',
    });
  }

  async exchangeCode(code: string) {
    const { tokens } = await this.client.getToken(code);
    return tokens;
  }

  async getUserInfo(accessToken: string) {
    try {
      const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('❌ [AuthService] Error fetching user info:', error);
      throw error;
    }
  }

  private encrypt(plain: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encKey, iv);
    const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, enc]).toString('base64');
  }

  async persistTokens(
    userEmail: string,
    tokens: { access_token?: string | null; refresh_token?: string | null; expiry_date?: number | null },
  ) {
    const user = await this.prisma.user.upsert({
      where: { email: userEmail },
      update: {},
      create: { email: userEmail },
    });
    const accessTokenEnc = tokens.access_token ? this.encrypt(tokens.access_token) : '';
    const refreshTokenEnc = tokens.refresh_token ? this.encrypt(tokens.refresh_token) : null;
    const expiryDate = tokens.expiry_date ? new Date(tokens.expiry_date) : null;
    await this.prisma.oAuthToken.create({
      data: {
        userId: user.id,
        provider: 'google',
        accessTokenEnc,
        refreshTokenEnc,
        expiryDate,
      },
    });
  }
}


