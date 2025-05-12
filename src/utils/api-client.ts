import { retryWithBackoff } from './retry';
import { errorReporter } from './error-reporting';
import type { FacebookApiResponse, FacebookError } from '@/types/facebook';

class ApiError extends Error {
  code?: number;
  subcode?: number;
  traceId?: string;
  isTransient: boolean;
  response?: Response;

  constructor(error: FacebookError) {
    super(error.message);
    this.name = 'ApiError';
    this.code = error.code;
    this.subcode = error.error_subcode;
    this.traceId = error.fbtrace_id;
    this.isTransient = isTransientError(error.code);
  }
}

// Helper function to identify transient errors
function isTransientError(code?: number): boolean {
  if (!code) return false;
  
  const transientCodes = [
    1,    // API Unknown
    2,    // API Service
    4,    // API Too Many Calls
    17,   // API User Too Many Calls
    341,  // Application limit reached
    368,  // Temporary oauth error
  ];

  return transientCodes.includes(code);
}

export async function fetchWithRetry<T>(
  url: string, 
  options: RequestInit = {}
): Promise<T> {
  return retryWithBackoff(async () => {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data: FacebookApiResponse<T> = await response.json();

    if (!response.ok) {
      const traceId = response.headers.get('x-fb-trace-id') || '';
      const error = new ApiError({ 
        message: `HTTP error! status: ${response.status}`,
        code: response.status,
        type: 'http_error',
        fbtrace_id: traceId
      });
      error.response = response;
      
      await errorReporter.report(error, {
        url,
        status: response.status,
        statusText: response.statusText,
        traceId
      });
      throw error;
    }

    if (data.error) {
      const apiError = new ApiError(data.error);
      await errorReporter.reportFacebookError(data.error, {
        url,
        method: options.method || 'GET',
      });
      throw apiError;
    }

    return data.data as T;
  }, {
    maxRetries: 3,
    shouldRetry: (error: Error) => {
      if (error instanceof ApiError) {
        // Only retry transient errors
        return error.isTransient;
      }
      // Retry on network errors or 5xx responses
      return true;
    }
  });
}

export const apiClient = {
  async get<T>(url: string, options: RequestInit = {}): Promise<T> {
    return fetchWithRetry<T>(url, {
      ...options,
      method: 'GET',
    });
  },

  async post<T>(url: string, data: any, options: RequestInit = {}): Promise<T> {
    return fetchWithRetry<T>(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Helper method for Facebook Graph API calls
  async fetchFromGraph<T>(endpoint: string, accessToken: string, params: Record<string, string> = {}): Promise<T> {
    const searchParams = new URLSearchParams({
      access_token: accessToken,
      ...params,
    });

    return this.get<T>(`https://graph.facebook.com/v18.0/${endpoint}?${searchParams}`);
  }
};