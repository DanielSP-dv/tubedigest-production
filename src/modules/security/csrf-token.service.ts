import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CSRFTokenService {
  private readonly logger = new Logger(CSRFTokenService.name);
  private readonly csrfTokens = new Set<string>();

  /**
   * Generate a new CSRF token
   */
  generateCSRFToken(): string {
    const token = crypto.randomBytes(32).toString('hex');
    this.csrfTokens.add(token);
    
    // Clean up old tokens (keep only last 1000 tokens)
    if (this.csrfTokens.size > 1000) {
      const tokensArray = Array.from(this.csrfTokens);
      this.csrfTokens.clear();
      tokensArray.slice(-500).forEach(token => this.csrfTokens.add(token));
    }

    this.logger.log(`Generated CSRF token: ${token.substring(0, 8)}...`);
    return token;
  }

  /**
   * Validate CSRF token
   */
  validateCSRFToken(token: string): boolean {
    if (!token) {
      return false;
    }

    const isValid = this.csrfTokens.has(token);
    if (!isValid) {
      this.logger.warn(`Invalid CSRF token: ${token.substring(0, 8)}...`);
    }
    
    return isValid;
  }

  /**
   * Remove a CSRF token (for cleanup)
   */
  removeCSRFToken(token: string): boolean {
    return this.csrfTokens.delete(token);
  }

  /**
   * Get the number of active tokens
   */
  getTokenCount(): number {
    return this.csrfTokens.size;
  }

  /**
   * Clear all tokens (for testing or emergency)
   */
  clearAllTokens(): void {
    this.csrfTokens.clear();
    this.logger.warn('All CSRF tokens cleared');
  }
}
