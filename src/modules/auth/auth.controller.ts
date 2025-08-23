import { Controller, Get, Post, Delete, Query, Res, Req, Param } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { TokenManagementService } from './token-management.service';
import { SessionTokenService } from '../security/session-token.service';
import { SecurityMiddleware } from '../security/security.middleware';
import { CSRFTokenService } from '../security/csrf-token.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenManagementService: TokenManagementService,
    private readonly sessionTokenService: SessionTokenService,
    private readonly securityMiddleware: SecurityMiddleware,
    private readonly csrfTokenService: CSRFTokenService,
  ) {}
  @Get('google')
  googleRedirect(@Res() res: Response) {
    const url = this.authService.getAuthUrl();
    return res.redirect(url);
  }

  @Get('google/callback')
  async googleCallback(@Query('code') code?: string, @Res() res?: Response) {
    console.log('🔍 [AuthController] OAuth callback received');
    console.log('🔍 [AuthController] Code:', code ? 'present' : 'missing');
    
    const frontendBase = process.env.FRONTEND_URL || 'http://localhost:3000';
    if (!code) {
      console.log('❌ [AuthController] No code provided, redirecting to error');
      return res?.redirect(`${frontendBase}/?auth=error`);
    }
    try {
      console.log('🔍 [AuthController] Exchanging code for tokens...');
      const tokens = await this.authService.exchangeCode(code);
      console.log('✅ [AuthController] Tokens received successfully');
      
      // Get actual user info from Google
      console.log('🔍 [AuthController] Fetching user info from Google...');
      const userInfo = await this.authService.getUserInfo(tokens.access_token!);
      const email = userInfo.email;
      console.log('✅ [AuthController] User email from Google:', email);
      
      console.log('🔍 [AuthController] Persisting tokens for email:', email);
      await this.authService.persistTokens(email, tokens);

      // Set cookies and redirect to frontend channel selection onboarding
      console.log('🔍 [AuthController] Setting cookies and redirecting...');
      res?.cookie('userEmail', email, {
        httpOnly: true,
        secure: false, // Set to true in production
        sameSite: 'lax', // Use lax for localhost development (none requires secure: true)
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        // Remove domain for localhost - let browser handle it
      });

      console.log('✅ [AuthController] Redirecting to:', `${frontendBase}/channels`);
      return res?.redirect(`${frontendBase}/channels`);
    } catch (e) {
      console.error('❌ [AuthController] OAuth callback error:', e);
      return res?.redirect(`${frontendBase}/?auth=error`);
    }
  }

  @Get('logout')
  async logoutGet(@Res() res: Response) {
    const frontendBase = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.clearCookie('userEmail');
    return res.redirect(frontendBase);
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    try {
      // Clear user email cookie
      res.clearCookie('userEmail');
      
      // Return success response
      return res.status(200).json({ 
        success: true, 
        message: 'Logout successful' 
      });
    } catch (error) {
      console.error('❌ [AuthController] Logout error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Logout failed' 
      });
    }
  }

  // Enhanced OAuth Connection Management Endpoints

  @Get('tokens')
  async getUserConnections(@Req() req: Request) {
    try {
      const userEmail = req.cookies?.userEmail;
      if (!userEmail) {
        return { success: false, message: 'User not authenticated' };
      }

      // Get user ID from email
      const prisma = new (await import('@prisma/client')).PrismaClient();
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      const connections = await this.tokenManagementService.getUserConnections(user.id);
      return { success: true, connections };
    } catch (error) {
      console.error('❌ [AuthController] Get connections error:', error);
      return { success: false, message: 'Failed to retrieve connections' };
    }
  }

  @Delete('tokens/:provider')
  async revokeConnection(@Param('provider') provider: string, @Req() req: Request) {
    try {
      const userEmail = req.cookies?.userEmail;
      if (!userEmail) {
        return { success: false, message: 'User not authenticated' };
      }

      // Get user ID from email
      const prisma = new (await import('@prisma/client')).PrismaClient();
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Find the token for this provider
      const token = await prisma.oAuthToken.findFirst({
        where: { userId: user.id, provider },
      });

      if (!token) {
        return { success: false, message: 'Connection not found' };
      }

      const success = await this.tokenManagementService.revokeConnection(token.id, user.id);
      return { success, message: success ? 'Connection revoked successfully' : 'Failed to revoke connection' };
    } catch (error) {
      console.error('❌ [AuthController] Revoke connection error:', error);
      return { success: false, message: 'Failed to revoke connection' };
    }
  }

  @Post('tokens/refresh')
  async refreshToken(@Req() req: Request) {
    try {
      const userEmail = req.cookies?.userEmail;
      if (!userEmail) {
        return { success: false, message: 'User not authenticated' };
      }

      // Get user ID from email
      const prisma = new (await import('@prisma/client')).PrismaClient();
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Find the first token for this user (assuming one provider for now)
      const token = await prisma.oAuthToken.findFirst({
        where: { userId: user.id },
      });

      if (!token) {
        return { success: false, message: 'No OAuth connection found' };
      }

      const result = await this.tokenManagementService.refreshToken(token.id);
      return { 
        success: result.success, 
        message: result.success ? 'Token refreshed successfully' : result.error,
        newExpiry: result.newExpiry,
      };
    } catch (error) {
      console.error('❌ [AuthController] Refresh token error:', error);
      return { success: false, message: 'Failed to refresh token' };
    }
  }

  // Security Endpoints

  @Get('csrf-token')
  async getCSRFToken(@Req() req: Request) {
    try {
      const csrfToken = this.csrfTokenService.generateCSRFToken();
      return { 
        success: true, 
        csrfToken,
        message: 'CSRF token generated successfully' 
      };
    } catch (error) {
      console.error('❌ [AuthController] CSRF token generation error:', error);
      return { success: false, message: 'Failed to generate CSRF token' };
    }
  }

  @Get('security/events')
  async getSecurityEvents(@Req() req: Request) {
    try {
      const userEmail = req.cookies?.userEmail;
      if (!userEmail) {
        return { success: false, message: 'User not authenticated' };
      }

      const events = this.securityMiddleware.getSecurityEvents();
      return { 
        success: true, 
        events,
        message: 'Security events retrieved successfully' 
      };
    } catch (error) {
      console.error('❌ [AuthController] Security events error:', error);
      return { success: false, message: 'Failed to retrieve security events' };
    }
  }

  @Get('security/rate-limit-stats')
  async getRateLimitStats(@Req() req: Request) {
    try {
      const userEmail = req.cookies?.userEmail;
      if (!userEmail) {
        return { success: false, message: 'User not authenticated' };
      }

      const stats = this.securityMiddleware.getRateLimitStats();
      return { 
        success: true, 
        stats,
        message: 'Rate limit statistics retrieved successfully' 
      };
    } catch (error) {
      console.error('❌ [AuthController] Rate limit stats error:', error);
      return { success: false, message: 'Failed to retrieve rate limit statistics' };
    }
  }

  @Post('security/clear-rate-limit')
  async clearRateLimit(@Req() req: Request, @Query('ip') ip: string) {
    try {
      const userEmail = req.cookies?.userEmail;
      if (!userEmail) {
        return { success: false, message: 'User not authenticated' };
      }

      if (!ip) {
        return { success: false, message: 'IP address is required' };
      }

      const cleared = this.securityMiddleware.clearRateLimit(ip);
      return { 
        success: true, 
        cleared,
        message: cleared ? 'Rate limit cleared successfully' : 'IP not found in rate limit store' 
      };
    } catch (error) {
      console.error('❌ [AuthController] Clear rate limit error:', error);
      return { success: false, message: 'Failed to clear rate limit' };
    }
  }
}


