interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  factor?: number;
  shouldRetry?: (error: Error) => boolean;
  onRetry?: (error: Error, attempt: number) => void;
}

const defaultConfig: Required<Omit<RetryConfig, 'onRetry'>> = {
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
function getNextDelay(retryCount: number, config: Required<Omit<RetryConfig, 'onRetry'>>): number {
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
  let lastError: Error | null = null;

  for (let retryCount = 0; retryCount <= finalConfig.maxRetries; retryCount++) {
    try {
      if (retryCount > 0) {
        const delayMs = getNextDelay(retryCount - 1, finalConfig);
        await delay(delayMs);
      }
      
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if we should retry this error
      if (!finalConfig.shouldRetry(lastError)) {
        throw lastError;
      }

      // On last attempt, throw the error
      if (retryCount === finalConfig.maxRetries) {
        throw lastError;
      }

      // Call onRetry callback if provided
      if (finalConfig.onRetry) {
        finalConfig.onRetry(lastError, retryCount + 1);
      }

      // Log retry attempt in development
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `Retry attempt ${retryCount + 1}/${finalConfig.maxRetries}:`, 
          lastError instanceof Error ? lastError.message : lastError
        );
      }
    }
  }

  throw lastError;
}