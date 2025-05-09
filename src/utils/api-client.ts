import { retryWithBackoff } from './retry';
import type { FacebookResponse, FacebookError } from '@/types/facebook';

class ApiError extends Error {
  code?: number;
  subcode?: number;
  traceId?: string;

  constructor(error: FacebookError) {
    super(error.message);
    this.name = 'ApiError';
    this.code = error.code;
    this.subcode = error.error_subcode;
    this.traceId = error.fbtrace_id;
  }
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

    const data: FacebookResponse<T> = await response.json();

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (data.error) {
      throw new ApiError(data.error);
    }

    return data.data as T;
  }, {
    maxRetries: 3,
    shouldRetry: (error) => {
      if (error instanceof ApiError) {
        // Retry on rate limits or temporary errors
        return [4, 17, 2, 1].includes(error.code || 0);
      }
      // Retry on network errors or 5xx responses
      return !error.response || error.response.status >= 500;
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
  }
};