import { Test, TestingModule } from '@nestjs/testing';
import { SecurityMiddleware, SecurityEvent } from './security.middleware';
import { Request, Response } from 'express';

describe('SecurityMiddleware', () => {
  let middleware: SecurityMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SecurityMiddleware],
    }).compile();

    middleware = module.get<SecurityMiddleware>(SecurityMiddleware);

    // Reset mocks
    mockRequest = {
      method: 'GET',
      path: '/auth/login',
      headers: {
        'user-agent': 'Test User Agent',
        'x-forwarded-for': '192.168.1.1',
      },
      get: jest.fn((header: string) => {
        const headers = mockRequest.headers as Record<string, string>;
        return headers[header.toLowerCase()] || undefined;
      }) as any,
      connection: {
        remoteAddress: '192.168.1.1',
      } as any,
      socket: {
        remoteAddress: '192.168.1.1',
      } as any,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
    };

    mockNext = jest.fn();
  });

  describe('rate limiting', () => {
    it('should allow requests within rate limit', () => {
      // Make multiple requests within limit
      for (let i = 0; i < 50; i++) {
        middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      }

      expect(mockNext).toHaveBeenCalledTimes(50);
      expect(mockResponse.status).not.toHaveBeenCalledWith(429);
    });

    it('should block requests exceeding rate limit', () => {
      // Make requests exceeding the limit (100 requests per 15 minutes)
      for (let i = 0; i < 101; i++) {
        middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      }

      // The 101st request should be blocked
      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Rate limit exceeded',
        })
      );
    });

    it('should reset rate limit after window expires', () => {
      // Mock Date.now to simulate time passing
      const originalNow = Date.now;
      const mockNow = jest.fn();
      
      // First window
      mockNow.mockReturnValue(1000000);
      global.Date.now = mockNow;

      // Make requests up to limit
      for (let i = 0; i < 100; i++) {
        middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      }

      // Advance time past the window (15 minutes = 900000ms)
      mockNow.mockReturnValue(1000000 + 900001);

      // This request should be allowed again
      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(101);
      expect(mockResponse.status).not.toHaveBeenCalledWith(429);

      // Restore original Date.now
      global.Date.now = originalNow;
    });
  });

  describe('CSRF protection', () => {
    it('should allow GET requests without CSRF token', () => {
      mockRequest.method = 'GET';
      
      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalledWith(403);
    });

    it('should require CSRF token for POST requests', () => {
      mockRequest.method = 'POST';
      
      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'CSRF token validation failed',
        })
      );
    });

    it('should allow POST requests with valid CSRF token', () => {
      const csrfToken = middleware.generateCSRFToken();
      mockRequest.method = 'POST';
      mockRequest.headers = {
        ...mockRequest.headers,
        'x-csrf-token': csrfToken,
      };
      
      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalledWith(403);
    });
  });

  describe('security headers', () => {
    it('should add security headers to response', () => {
      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    });
  });

  describe('CSRF token generation', () => {
    it('should generate unique CSRF tokens', () => {
      const token1 = middleware.generateCSRFToken();
      const token2 = middleware.generateCSRFToken();

      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
      expect(token1).toMatch(/^[a-f0-9]{64}$/); // 32 bytes = 64 hex chars
    });

    it('should clean up old tokens when limit is exceeded', () => {
      // Generate more than 1000 tokens to trigger cleanup
      const tokens = [];
      for (let i = 0; i < 1100; i++) {
        tokens.push(middleware.generateCSRFToken());
      }

      // The first 600 tokens should be cleaned up, leaving the last 500
      expect(tokens.length).toBe(1100);
    });
  });

  describe('security event logging', () => {
    it('should log security events', () => {
      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      const events = middleware.getSecurityEvents();
      expect(events.length).toBeGreaterThan(0);
      expect(events[0]).toMatchObject({
        eventType: 'login_attempt',
        ip: '192.168.1.1',
        method: 'GET',
        path: '/auth/login',
      });
    });

    it('should log rate limit exceeded events', () => {
      // Exceed rate limit
      for (let i = 0; i < 101; i++) {
        middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      }

      const events = middleware.getSecurityEvents();
      const rateLimitEvent = events.find(e => e.eventType === 'rate_limit_exceeded');
      expect(rateLimitEvent).toBeDefined();
      expect(rateLimitEvent?.ip).toBe('192.168.1.1');
    });

    it('should log CSRF violation events', () => {
      mockRequest.method = 'POST';
      
      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      const events = middleware.getSecurityEvents();
      const csrfEvent = events.find(e => e.eventType === 'csrf_violation');
      expect(csrfEvent).toBeDefined();
      expect(csrfEvent?.method).toBe('POST');
    });
  });

  describe('rate limit statistics', () => {
    it('should provide rate limit statistics', () => {
      // Make some requests
      for (let i = 0; i < 5; i++) {
        middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      }

      const stats = middleware.getRateLimitStats();
      expect(stats['192.168.1.1']).toBeDefined();
      expect(stats['192.168.1.1'].count).toBe(5);
    });

    it('should clear rate limit for specific IP', () => {
      // Make some requests
      for (let i = 0; i < 5; i++) {
        middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      }

      const cleared = middleware.clearRateLimit('192.168.1.1');
      expect(cleared).toBe(true);

      const stats = middleware.getRateLimitStats();
      expect(stats['192.168.1.1']).toBeUndefined();
    });
  });

  describe('client IP detection', () => {
    it('should detect IP from x-forwarded-for header', () => {
      mockRequest.headers = {
        'x-forwarded-for': '10.0.0.1',
      };

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      const events = middleware.getSecurityEvents();
      expect(events[0].ip).toBe('10.0.0.1');
    });

    it('should detect IP from x-real-ip header', () => {
      mockRequest.headers = {
        'x-real-ip': '172.16.0.1',
      };

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      const events = middleware.getSecurityEvents();
      expect(events[0].ip).toBe('172.16.0.1');
    });

    it('should fall back to connection remote address', () => {
      mockRequest.headers = {};
      mockRequest.connection = {
        remoteAddress: '127.0.0.1',
      } as any;

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      const events = middleware.getSecurityEvents();
      expect(events[0].ip).toBe('127.0.0.1');
    });
  });
});
