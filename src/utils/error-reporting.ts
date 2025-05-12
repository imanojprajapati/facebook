interface ErrorReport {
  message: string;
  stack?: string;
  timestamp: string;
  url: string;
  type: string;
}

interface ErrorContext {
  userId?: string;
  pageId?: string;
  url?: string;
  action?: string;
  [key: string]: any;
}

// Strip sensitive data like tokens from error messages
function sanitizeErrorMessage(message: string): string {
  return message.replace(/[?&]access_token=[^&]+/, '?access_token=[REDACTED]')
               .replace(/EAA[a-zA-Z0-9]+/, '[REDACTED_TOKEN]');
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

  async report(error: Error, context: ErrorContext = {}): Promise<void> {
    // Include basic context
    const errorContext = {
      timestamp: new Date().toISOString(),
      environment: this.environment,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      ...context
    };

    // In development, log to console with full context
    if (this.environment === 'development') {
      console.group('Error Report');
      console.error(error);
      console.log('Context:', errorContext);
      console.groupEnd();
      return;
    }

    // In production, send to error reporting endpoint
    try {
      const response = await fetch('/api/error-reporting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: error.name,
          message: error.message,
          stack: error.stack,
          context: errorContext,
        }),
      });

      if (!response.ok) {
        console.error('Failed to report error:', await response.text());
      }
    } catch (reportingError) {
      // Fallback to console if reporting fails
      console.error('Error reporting failed:', reportingError);
      console.error('Original error:', error);
    }
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

  // Handle Facebook-specific errors with detailed reporting
  async reportFacebookError(error: any, context: ErrorContext = {}): Promise<void> {
    const fbError = new Error(error.message || 'Facebook API Error');
    
    // Extract Facebook error details
    const fbErrorDetails = {
      errorCode: error.code,
      errorSubcode: error.error_subcode,
      errorType: error.type,
      fbTraceId: error.fbtrace_id,
      isTransient: this.isFacebookTransientError(error.code),
    };

    // Get user-friendly error message
    const userMessage = this.getFacebookErrorMessage(error.code, error.error_subcode);

    await this.report(fbError, {
      ...context,
      type: 'facebook_error',
      errorDetails: fbErrorDetails,
      userMessage,
    });

    // Log additional debug information in development
    if (process.env.NODE_ENV === 'development') {
      console.group('Facebook Error Details');
      console.error('Error:', error);
      console.log('Error Type:', fbErrorDetails.errorType);
      console.log('Error Code:', fbErrorDetails.errorCode);
      console.log('Error Subcode:', fbErrorDetails.errorSubcode);
      console.log('Trace ID:', fbErrorDetails.fbTraceId);
      console.log('Is Transient:', fbErrorDetails.isTransient);
      console.log('User Message:', userMessage);
      console.groupEnd();
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