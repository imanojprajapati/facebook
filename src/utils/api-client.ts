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
  path?: string;

  constructor(error: FacebookError, path?: string) {
    super(error.message);
    this.name = 'ApiError';
    this.code = error.code;
    this.subcode = error.error_subcode;
    this.traceId = error.fbtrace_id;
    this.path = path;
    this.isTransient = isTransientError(error.code, error.error_subcode);
  }
}

function isTransientError(code?: number, subcode?: number): boolean {
  if (!code) return false;
  
  const transientCodes = new Set([
    1,    // API Unknown
    2,    // API Service
    4,    // API Too Many Calls
    17,   // API User Too Many Calls
    32,   // Page request limit reached
    341,  // Application limit reached
    368,  // Temporary OAuth error
    190,  // Invalid access token (might be temporary)
    506,  // Duplicate request
    1 // Generic API failure (might be temporary)
  ]);

  const transientSubcodes = new Set([
    458, // Request timeout
    459, // Page request timeout
    463, // API calls quota exceeded
    464, // API calls system limit exceeded
    467  // Rate limit hit
  ]);

  return transientCodes.has(code) || (subcode ? transientSubcodes.has(subcode) : false);
}

async function handleFacebookResponse<T>(response: Response, path: string): Promise<T> {
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

    const apiError = new ApiError(error, path);
    apiError.response = response;
    throw apiError;
  }

  if (!isJson) {
    throw new Error('Expected JSON response from Facebook API');
  }

  try {
    return await response.json();
  } catch (error) {
    throw new ApiError({
      message: 'Failed to parse JSON response',
      type: 'parse_error',
      code: 0
    }, path);
  }
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

        return await handleFacebookResponse<T>(response, path);
      } catch (error) {
        // Track API errors with more context
        errorReporter.reportFacebookError(error, {
          path,
          params: Object.keys(params).join(','),
          isTransient: error instanceof ApiError ? error.isTransient : false,
          statusCode: error instanceof ApiError && error.response ? error.response.status : undefined
        });

        // If it's not a transient error, don't retry
        if (error instanceof ApiError && !error.isTransient) {
          console.error(`❌ Non-transient API error for ${path}:`, error);
          throw error;
        }

        throw error;
      }
    }, {
      maxRetries: 5,
      initialDelay: 1000,
      maxDelay: 10000,
      shouldRetry: (error) => {
        if (error instanceof ApiError) {
          return error.isTransient;
        }
        return true; // Retry network errors
      }
    });
  }
};