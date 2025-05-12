interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  factor?: number;
  shouldRetry?: (error: Error) => boolean;
  onRetry?: (error: Error, attempt: number) => void;
}

const defaultConfig: Required<Omit<RetryConfig, 'onRetry' | 'shouldRetry'>> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  factor: 2,
};

// Facebook specific error codes that should not be retried
const NON_RETRYABLE_FB_CODES = new Set([
  190,  // Invalid OAuth access token
  200,  // Permission error
  10,   // Application does not have permission
  2500, // Invalid API version
]);

function isFacebookError(error: any): error is { error: { code: number; message: string } } {
  return error?.error?.code && typeof error.error.code === 'number';
}

function shouldRetryFacebookError(error: any): boolean {
  if (isFacebookError(error)) {
    // Don't retry if error code is in non-retryable set
    if (NON_RETRYABLE_FB_CODES.has(error.error.code)) {
      return false;
    }
    
    // Retry rate limiting errors
    if (error.error.code === 4 || error.error.code === 17) {
      return true;
    }
    
    // Retry on temporary Facebook errors
    if (error.error.code >= 1 && error.error.code <= 3) {
      return true;
    }
  }

  // Retry on network errors
  if (error instanceof TypeError && error.message.includes('network')) {
    return true;
  }

  // Default to retry on unknown errors
  return true;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getNextDelay(retryCount: number, config: Required<Omit<RetryConfig, 'onRetry' | 'shouldRetry'>>): number {
  const exponentialDelay = config.initialDelay * Math.pow(config.factor, retryCount);
  const boundedDelay = Math.min(exponentialDelay, config.maxDelay);
  // Add random jitter between 0-25% of the delay
  const jitter = Math.random() * 0.25 * boundedDelay;
  return boundedDelay + jitter;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const finalConfig = {
    ...defaultConfig,
    shouldRetry: config.shouldRetry || shouldRetryFacebookError,
    ...config,
  };
  
  let lastError: Error | null = null;

  for (let retryCount = 0; retryCount <= finalConfig.maxRetries; retryCount++) {
    try {
      if (retryCount > 0) {
        const delayMs = getNextDelay(retryCount - 1, finalConfig);
        await delay(delayMs);
        
        if (finalConfig.onRetry && lastError) {
          finalConfig.onRetry(lastError, retryCount);
        }
      }
      
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (retryCount === finalConfig.maxRetries || !finalConfig.shouldRetry(lastError)) {
        throw lastError;
      }
    }
  }

  throw lastError; // This line should never be reached due to the throw in the catch block
}