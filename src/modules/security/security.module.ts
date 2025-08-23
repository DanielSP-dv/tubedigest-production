import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { SecurityMiddleware } from './security.middleware';
import { SessionTokenService } from './session-token.service';
import { CSRFTokenService } from './csrf-token.service';

@Module({
  providers: [SecurityMiddleware, SessionTokenService, CSRFTokenService],
  exports: [SecurityMiddleware, SessionTokenService, CSRFTokenService],
})
export class SecurityModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecurityMiddleware)
      .forRoutes(
        // Apply to all auth routes
        { path: '/auth/*', method: RequestMethod.ALL },
        // Apply to all API routes that need security
        { path: '/api/*', method: RequestMethod.ALL },
        // Apply to specific sensitive endpoints
        { path: '/me', method: RequestMethod.ALL },
        { path: '/channels/*', method: RequestMethod.ALL },
        { path: '/digests/*', method: RequestMethod.ALL },
        { path: '/watchlater/*', method: RequestMethod.ALL },
      );
  }
}
