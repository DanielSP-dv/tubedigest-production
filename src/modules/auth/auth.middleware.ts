import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

// Extend Express Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: any;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private prisma = new PrismaClient();

  use = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      console.log(`🔍 [Auth Middleware] Processing ${req.method} ${req.path}`);
      
      // SIMPLIFIED: Just check for user email in cookies (set by OAuth callback)
      const userEmail = req.cookies?.userEmail as string;
      
      if (userEmail) {
        console.log(`🔍 [Auth Middleware] Found user email: ${userEmail}`);
        const user = await this.prisma.user.findUnique({
          where: { email: userEmail },
          include: { tokens: true }
        });

        if (user) {
          console.log(`✅ [Auth Middleware] User authenticated: ${user.email}`);
          req.user = user;
          return next();
        } else {
          console.log(`❌ [Auth Middleware] User not found for email: ${userEmail}`);
        }
      }

      // No valid authentication found
      console.log(`❌ [Auth Middleware] No authentication for ${req.method} ${req.path}`);
      
      // For protected endpoints, require authentication
      if (this.requiresAuth(req.path)) {
        console.log(`🚫 [Auth Middleware] Authentication required for ${req.path}`);
        throw new UnauthorizedException('Authentication required');
      }
      
      // For public endpoints, allow unauthenticated
      console.log(`✅ [Auth Middleware] Allowing unauthenticated access to ${req.path}`);
      req.user = null;
      next();
    } catch (error) {
      console.error('❌ [Auth Middleware] Error:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      req.user = null;
      next();
    }
  }

  // REMOVED: validateSession method - simplified to just use user email cookie

  private requiresAuth(path: string): boolean {
    // Define which endpoints require authentication
    const protectedPaths = [
      '/channels',
      '/channels/selected', 
      '/channels/select',
      '/videos/digest',
      '/videos/ingest',
      '/digests',
      '/me'
    ];
    
    return protectedPaths.some(protectedPath => 
      path.startsWith(protectedPath)
    );
  }
}
