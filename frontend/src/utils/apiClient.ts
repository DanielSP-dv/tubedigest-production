/**
 * Secure API client that automatically handles CSRF tokens
 * for state-changing operations (POST, PUT, DELETE)
 */

interface ApiClientOptions {
  baseURL?: string;
  credentials?: RequestCredentials;
}

interface ApiRequestOptions extends RequestInit {
  skipCSRF?: boolean; // Skip CSRF token for certain requests
}

class ApiClient {
  private baseURL: string;
  private credentials: RequestCredentials;
  private csrfToken: string | null = null;

  constructor(options: ApiClientOptions = {}) {
    this.baseURL = options.baseURL || '/api';
    this.credentials = options.credentials || 'include';
  }

  /**
   * Set CSRF token for future requests
   */
  setCSRFToken(token: string | null): void {
    this.csrfToken = token;
  }

  /**
   * Get CSRF token
   */
  getCSRFToken(): string | null {
    return this.csrfToken;
  }

  /**
   * Make a secure API request with automatic CSRF token handling
   */
  async request<T = any>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const method = options.method?.toUpperCase() || 'GET';
    
    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add CSRF token for state-changing operations
    const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    if (isStateChanging && !options.skipCSRF && this.csrfToken) {
      headers['x-csrf-token'] = this.csrfToken;
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      credentials: this.credentials,
      headers,
      ...options,
    };

    // Remove skipCSRF from request options (not a valid fetch option)
    delete (requestOptions as any).skipCSRF;

    try {
      const response = await fetch(url, requestOptions);
      
      // Handle CSRF token errors
      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error === 'CSRF token validation failed') {
          // CSRF token expired or invalid - clear it so it can be refreshed
          this.csrfToken = null;
          throw new Error('CSRF token expired. Please try again.');
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text() as T;
    } catch (error) {
      console.error(`❌ [ApiClient] Request failed: ${method} ${url}`, error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for testing
export { ApiClient };
