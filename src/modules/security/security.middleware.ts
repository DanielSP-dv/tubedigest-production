import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CSRFTokenService } from './csrf-token.service';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message: string;
}

export interface SecurityEvent {
  timestamp: Date;
  ip: string;
  userAgent: string;
  method: string;
  path: string;
  userId?: string;
  eventType: 'login_attempt' | 'failed_login' | 'rate_limit_exceeded' | 'csrf_violation' | 'suspicious_activity';
  metadata?: Record<string, any>;
}

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityMiddleware.name);
  private readonly rateLimitStore = new Map<string, { count: number; resetTime: number }>();
  private readonly securityEvents: SecurityEvent[] = [];

  // Rate limiting configuration
  private readonly rateLimitConfig: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 200, // Increased to 200 requests per window for normal usage
    message: 'Too many requests, please try again later.',
  };

  constructor(private readonly csrfTokenService: CSRFTokenService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const clientIp = this.getClientIp(req);
    const userAgent = req.get('User-Agent') || 'Unknown';

    // Log security event
    this.logSecurityEvent({
      timestamp: new Date(),
      ip: clientIp,
      userAgent,
      method: req.method,
      path: req.path,
      eventType: 'login_attempt',
    });

    // Check rate limiting (with higher limits for CSRF token requests)
    const isCSRFTokenRequest = req.path.includes('/csrf-token');
    const rateLimitPassed = isCSRFTokenRequest 
      ? this.checkRateLimit(clientIp, 300) // Higher limit for CSRF tokens
      : this.checkRateLimit(clientIp);
      
    if (!rateLimitPassed) {
      this.logSecurityEvent({
        timestamp: new Date(),
        ip: clientIp,
        userAgent,
        method: req.method,
        path: req.path,
        eventType: 'rate_limit_exceeded',
        metadata: { rateLimitConfig: this.rateLimitConfig },
      });

      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: this.rateLimitConfig.message,
        retryAfter: this.getRetryAfter(clientIp),
      });
    }

    // Check CSRF protection for state-changing operations
    if (this.isStateChangingOperation(req.method) && !this.validateCSRFToken(req)) {
      this.logSecurityEvent({
        timestamp: new Date(),
        ip: clientIp,
        userAgent,
        method: req.method,
        path: req.path,
        eventType: 'csrf_violation',
        metadata: { csrfToken: req.headers['x-csrf-token'] },
      });

      return res.status(403).json({
        error: 'CSRF token validation failed',
        message: 'Invalid or missing CSRF token',
      });
    }

    // Add security headers
    this.addSecurityHeaders(res);

    // Continue to next middleware
    next();

    // Log response time for performance monitoring
    const responseTime = Date.now() - startTime;
    if (responseTime > 1000) { // Log slow requests
      this.logger.warn(`Slow request: ${req.method} ${req.path} took ${responseTime}ms`);
    }
  }

  /**
   * Get client IP address
   */
  private getClientIp(req: Request): string {
    return (
      req.headers['x-forwarded-for'] as string ||
      req.headers['x-real-ip'] as string ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }

  /**
   * Check rate limiting for the client IP
   */
  private checkRateLimit(clientIp: string, customLimit?: number): boolean {
    const now = Date.now();
    const windowStart = now - this.rateLimitConfig.windowMs;

    // Clean up old entries
    for (const [ip, data] of this.rateLimitStore.entries()) {
      if (data.resetTime < now) {
        this.rateLimitStore.delete(ip);
      }
    }

    // Get current rate limit data for this IP
    const currentData = this.rateLimitStore.get(clientIp);

    if (!currentData || currentData.resetTime < now) {
      // First request or window expired
      this.rateLimitStore.set(clientIp, {
        count: 1,
        resetTime: now + this.rateLimitConfig.windowMs,
      });
      return true;
    }

    const maxRequests = customLimit ?? this.rateLimitConfig.maxRequests;
    if (currentData.count >= maxRequests) {
      return false;
    }

    // Increment request count
    currentData.count++;
    this.rateLimitStore.set(clientIp, currentData);
    return true;
  }

  /**
   * Get retry after time for rate limited requests
   */
  private getRetryAfter(clientIp: string): number {
    const data = this.rateLimitStore.get(clientIp);
    if (!data) return 0;
    return Math.ceil((data.resetTime - Date.now()) / 1000);
  }

  /**
   * Check if the operation is state-changing
   */
  private isStateChangingOperation(method: string): boolean {
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
  }

  /**
   * Validate CSRF token
   */
  private validateCSRFToken(req: Request): boolean {
    const csrfToken = req.headers['x-csrf-token'] as string;
    return this.csrfTokenService.validateCSRFToken(csrfToken);
  }

  /**
   * Add security headers to response
   */
  private addSecurityHeaders(res: Response): void {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  /**
   * Log security event
   */
  private logSecurityEvent(event: SecurityEvent): void {
    this.securityEvents.push(event);
    
    // Keep only last 1000 events
    if (this.securityEvents.length > 1000) {
      this.securityEvents.splice(0, this.securityEvents.length - 1000);
    }

    // Log to console for now (in production, this would go to a security log)
    this.logger.log(`Security Event: ${event.eventType} from ${event.ip} - ${event.method} ${event.path}`);
  }

  /**
   * Get security events (for monitoring)
   */
  getSecurityEvents(): SecurityEvent[] {
    return [...this.securityEvents];
  }

  /**
   * Get rate limit statistics
   */
  getRateLimitStats(): Record<string, { count: number; resetTime: number }> {
    const stats: Record<string, { count: number; resetTime: number }> = {};
    for (const [ip, data] of this.rateLimitStore.entries()) {
      stats[ip] = { ...data };
    }
    return stats;
  }

  /**
   * Clear rate limit for a specific IP (for admin use)
   */
  clearRateLimit(clientIp: string): boolean {
    return this.rateLimitStore.delete(clientIp);
  }
}
