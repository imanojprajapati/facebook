interface ErrorReport {
  message: string;
  stack?: string;
  timestamp: string;
  url: string;
  type: string;
  context?: Record<string, any>;
  errorCode?: number;
  errorType?: string;
  traceId?: string;
}

interface ErrorContext {
  userId?: string;
  pageId?: string;
  url?: string;
  action?: string;
  [key: string]: any;
}

interface FacebookErrorDetails {
  code?: number;
  type?: string;
  message?: string;
  fbtrace_id?: string;
  error_subcode?: number;
}

// Strip sensitive data like tokens from error messages
function sanitizeErrorMessage(message: string): string {
  return message.replace(/[?&]access_token=[^&]+/, '?access_token=[REDACTED]')
               .replace(/EAA[a-zA-Z0-9]+/, '[REDACTED_TOKEN]');
}

function extractFacebookError(error: any): FacebookErrorDetails {
  if (!error) return {};

  // Handle standard Facebook API error format
  if (error.error?.message) {
    return {
      message: error.error.message,
      code: error.error.code,
      type: error.error.type,
      fbtrace_id: error.error.fbtrace_id,
      error_subcode: error.error.error_subcode
    };
  }

  // Handle error response format
  if (error.message && error.code) {
    return {
      message: error.message,
      code: error.code,
      type: error.type,
      fbtrace_id: error.fbtrace_id,
      error_subcode: error.error_subcode
    };
  }

  return {
    message: error.message || 'Unknown Facebook Error',
    code: error.code,
    type: error.type
  };
}

// Error reporting utility
class ErrorReporter {
  private static instance: ErrorReporter;
  private errorQueue: ErrorReport[] = [];
  private readonly maxQueueSize = 50;
  private readonly flushInterval = 60000; // 1 minute
  private readonly environment: string;
  private isClient: boolean;
  private hasInitialized: boolean = false;

  private constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.isClient = false; // Initialize as false, will be updated during init
    this.initializeIfClient();
  }

  private initializeIfClient() {
    // Skip if already initialized or in server environment
    if (this.hasInitialized || typeof window === 'undefined') return;
    
    this.isClient = true;
    this.hasInitialized = true;
    this.setupGlobalHandlers();
    this.startPeriodicFlush();
  }

  public static getInstance(): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter();
    }
    return ErrorReporter.instance;
  }

  private setupGlobalHandlers() {
    if (!this.isClient || typeof window === 'undefined') return;

    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message));
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(event.reason);
    });
  }

  private startPeriodicFlush() {
    if (!this.isClient || typeof window === 'undefined') return;

    setInterval(() => this.flush(), this.flushInterval);
  }

  public captureError(error: Error | unknown, context: Record<string, any> = {}) {
    // Initialize client-side features if needed
    this.initializeIfClient();

    const errorReport: ErrorReport = {
      message: sanitizeErrorMessage(error instanceof Error ? error.message : String(error)),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      url: this.isClient ? window.location.href : 'server',
      type: error instanceof Error ? error.name : 'Unknown'
    };

    this.errorQueue.push(errorReport);

    // Keep queue size under control
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(-this.maxQueueSize);
    }

    if (process.env.NODE_ENV === 'development') {
      console.error('Error captured:', errorReport);
    }
  }

  private async flush() {
    if (this.errorQueue.length === 0) return;

    try {
      const errors = [...this.errorQueue];
      this.errorQueue = [];

      // In production, send to your error reporting service
      if (process.env.NODE_ENV === 'production') {
        await fetch('/api/error-reporting', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ errors }),
        });
      }
    } catch (error) {
      console.error('Failed to flush errors:', error);
      // Re-add failed errors to the queue
      this.errorQueue.unshift(...this.errorQueue);
    }
  }

  async report(error: Error | unknown, context: ErrorContext = {}): Promise<void> {
    const errorReport: ErrorReport = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      url: this.isClient ? window.location.href : 'server',
      type: context.type || 'unknown',
      context: this.sanitizeContext(context)
    };

    await this.queueError(errorReport);
  }

  async reportApiError(error: unknown, endpoint: string, context: ErrorContext = {}): Promise<void> {
    if (error instanceof Error) {
      await this.report(error, {
        ...context,
        type: 'api_error',
        endpoint,
      });
    } else {
      await this.report(new Error(typeof error === 'string' ? error : 'Unknown API error'), {
        ...context,
        type: 'api_error',
        endpoint,
        originalError: error,
      });
    }
  }

  public async reportFacebookError(error: unknown, context: ErrorContext = {}): Promise<void> {
    const fbError = extractFacebookError(error);
    
    const errorReport: ErrorReport = {
      message: sanitizeErrorMessage(fbError.message || 'Facebook API Error'),
      timestamp: new Date().toISOString(),
      url: this.isClient ? window.location.href : 'server',
      type: 'facebook_error',
      errorCode: fbError.code,
      errorType: fbError.type,
      traceId: fbError.fbtrace_id,
      context: this.sanitizeContext({
        ...context,
        errorSubcode: fbError.error_subcode
      })
    };

    if (error instanceof Error) {
      errorReport.stack = error.stack;
    }

    await this.queueError(errorReport);
  }

  private sanitizeContext(context: ErrorContext): ErrorContext {
    const sanitized = { ...context };
    
    // Remove sensitive data from context
    if (sanitized.accessToken) {
      sanitized.accessToken = '[REDACTED]';
    }
    
    if (sanitized.sessionToken) {
      sanitized.sessionToken = '[REDACTED]';
    }

    return sanitized;
  }

  private async queueError(errorReport: ErrorReport): Promise<void> {
    this.errorQueue.push(errorReport);

    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(-this.maxQueueSize);
    }

    if (process.env.NODE_ENV === 'development') {
      console.error('Error queued:', errorReport);
    }
  }

  private isFacebookTransientError(code: number): boolean {
    // Facebook error codes that typically indicate temporary issues
    const transientErrors = [
      1, // API Unknown
      2, // API Service
      4, // API Too Many Calls
      17, // API User Too Many Calls
      341, // Application limit reached
      368, // Temporary oauth error
    ];

    return transientErrors.includes(code);
  }

  private getFacebookErrorMessage(code: number, subcode?: number): string {
    const errorMessages: Record<number, string> = {
      1: "Temporary Facebook service error. Please try again.",
      2: "Facebook service is temporarily unavailable.",
      4: "Too many requests. Please wait a few minutes and try again.",
      17: "Request limit reached. Please try again later.",
      190: "Facebook session expired. Please sign in again.",
      200: "Permission error. Please check app permissions.",
      341: "Application limit reached. Please try again later.",
      368: "Temporary login error. Please try again.",
      803: "Some permissions were not granted. Please try logging in again.",
    };

    return errorMessages[code] || "An error occurred with Facebook. Please try again.";
  }
}

export const errorReporter = ErrorReporter.getInstance();