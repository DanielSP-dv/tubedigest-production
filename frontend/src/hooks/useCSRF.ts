import { useState, useEffect } from 'react';

/**
 * Hook to manage CSRF tokens for API requests
 * Automatically fetches and refreshes CSRF tokens as needed
 */
export const useCSRF = () => {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch a new CSRF token from the backend
   */
  const fetchCSRFToken = async (): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/csrf-token', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.csrfToken) {
        setCsrfToken(data.csrfToken);
        return data.csrfToken;
      } else {
        throw new Error(data.message || 'Invalid CSRF token response');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('❌ [useCSRF] Failed to fetch CSRF token:', errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get current CSRF token, fetching a new one if needed
   */
  const getCSRFToken = async (): Promise<string | null> => {
    if (csrfToken) {
      return csrfToken;
    }
    return await fetchCSRFToken();
  };

  /**
   * Refresh CSRF token
   */
  const refreshCSRFToken = async (): Promise<string | null> => {
    setCsrfToken(null);
    return await fetchCSRFToken();
  };

  /**
   * Initialize CSRF token on mount
   */
  useEffect(() => {
    fetchCSRFToken();
  }, []);

  return {
    csrfToken,
    isLoading,
    error,
    fetchCSRFToken,
    getCSRFToken,
    refreshCSRFToken,
  };
};