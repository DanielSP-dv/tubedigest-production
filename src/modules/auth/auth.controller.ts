import { Controller, Get, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  googleRedirect(@Res() res: Response) {
    const url = this.authService.getAuthUrl();
    return res.redirect(url);
  }

  @Get('google/callback')
  async googleCallback(@Query('code') code?: string, @Res() res?: Response) {
    console.log('🔍 [AuthController] OAuth callback received');
    const frontendBase = process.env.FRONTEND_URL || 'https://frontend-rho-topaz-86.vercel.app';

    if (!code) {
      console.log('❌ [AuthController] No code provided, redirecting to error');
      return res?.redirect(`${frontendBase}/?auth=error`);
    }

    try {
      console.log('🔍 [AuthController] Exchanging code for tokens...');
      const tokens = await this.authService.exchangeCode(code);
      console.log('✅ [AuthController] Tokens received successfully');

      console.log('🔍 [AuthController] Fetching user info from Google...');
      const userInfo = await this.authService.getUserInfo(tokens.access_token!);
      const email = userInfo.email;
      console.log('✅ [AuthController] User email from Google:', email);

      console.log('🔍 [AuthController] Persisting tokens for email:', email);
      await this.authService.persistTokens(email, tokens);

      console.log('🔍 [AuthController] Setting cookies and redirecting...');
      res?.cookie('userEmail', email, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      console.log('✅ [AuthController] Redirecting to:', `${frontendBase}/channels`);
      return res?.redirect(`${frontendBase}/channels`);
    } catch (e) {
      console.error('❌ [AuthController] OAuth callback error:', e);
      return res?.redirect(`${frontendBase}/?auth=error`);
    }
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    try {
      res.clearCookie('userEmail');
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
}


