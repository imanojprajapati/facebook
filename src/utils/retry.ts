interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  factor?: number;
  shouldRetry?: (error: any) => boolean;
}

const defaultConfig: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelay: 1000, // Start with 1 second delay
  maxDelay: 10000,    // Maximum delay of 10 seconds
  factor: 2,          // Exponential factor
  shouldRetry: () => true
};

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculates the next delay using exponential backoff with jitter
 */
function getNextDelay(retryCount: number, config: Required<RetryConfig>): number {
  const exponentialDelay = config.initialDelay * Math.pow(config.factor, retryCount);
  const boundedDelay = Math.min(exponentialDelay, config.maxDelay);
  // Add random jitter between 0-25% of the delay
  const jitter = Math.random() * 0.25 * boundedDelay;
  return boundedDelay + jitter;
}

/**
 * Executes a function with retry logic using exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const finalConfig = { ...defaultConfig, ...config };
  let lastError: any;

  for (let retryCount = 0; retryCount <= finalConfig.maxRetries; retryCount++) {
    try {
      if (retryCount > 0) {
        const delayMs = getNextDelay(retryCount - 1, finalConfig);
        await delay(delayMs);
      }
      
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry this error
      if (!finalConfig.shouldRetry(error)) {
        throw error;
      }

      // On last attempt, throw the error
      if (retryCount === finalConfig.maxRetries) {
        throw error;
      }

      // Log retry attempt in development
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `Retry attempt ${retryCount + 1}/${finalConfig.maxRetries}:`, 
          error instanceof Error ? error.message : error
        );
      }
    }
  }

  throw lastError;
}