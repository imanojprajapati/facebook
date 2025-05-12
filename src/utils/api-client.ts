import { retryWithBackoff } from './retry';
import { errorReporter } from './error-reporting';
import type { FacebookApiResponse, FacebookError, FacebookErrorResponse } from '@/types/facebook';

const FACEBOOK_API_VERSION = 'v18.0';
const FACEBOOK_GRAPH_URL = 'https://graph.facebook.com';

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

function isTransientError(code?: number): boolean {
  if (!code) return false;
  
  const transientCodes = new Set([
    1,    // API Unknown
    2,    // API Service
    4,    // API Too Many Calls
    17,   // API User Too Many Calls
    341,  // Application limit reached
    368,  // Temporary OAuth error
    190,  // Invalid access token (might be temporary)
    506,  // Duplicate request
  ]);

  return transientCodes.has(code);
}

async function handleFacebookResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  
  if (!response.ok) {
    let error: FacebookError;
    
    try {
      if (isJson) {
        const errorData = await response.json() as FacebookErrorResponse;
        error = errorData.error;
      } else {
        error = {
          message: `HTTP ${response.status}: ${response.statusText}`,
          code: response.status,
          type: 'http_error',
          fbtrace_id: response.headers.get('x-fb-trace-id') || undefined
        };
      }
    } catch {
      error = {
        message: 'Failed to parse error response',
        code: response.status,
        type: 'parse_error',
        fbtrace_id: response.headers.get('x-fb-trace-id') || undefined
      };
    }

    const apiError = new ApiError(error);
    apiError.response = response;
    throw apiError;
  }

  if (!isJson) {
    throw new Error('Expected JSON response from Facebook API');
  }

  return response.json();
}

export const apiClient = {
  async fetchFromGraph<T>(
    path: string,
    accessToken: string,
    params: Record<string, string> = {}
  ): Promise<T> {
    const url = new URL(`${FACEBOOK_GRAPH_URL}/${FACEBOOK_API_VERSION}/${path}`);
    url.searchParams.append('access_token', accessToken);
    
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value);
    }

    return retryWithBackoff(async () => {
      try {
        const response = await fetch(url.toString(), {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        return await handleFacebookResponse<T>(response);
      } catch (error) {
        // Track API errors
        errorReporter.reportFacebookError(error, {
          path,
          params: Object.keys(params).join(',')
        });
        throw error;
      }
    }, {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 5000
    });
  },

  // Additional utility methods for specific Facebook API calls
  async validateAccessToken(accessToken: string): Promise<boolean> {
    try {
      const response = await this.fetchFromGraph<{ data: { is_valid: boolean } }>(
        'debug_token',
        accessToken,
        { input_token: accessToken }
      );
      return response.data.is_valid;
    } catch (error) {
      errorReporter.reportFacebookError(error, { context: 'token_validation' });
      return false;
    }
  }
};