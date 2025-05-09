import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface ErrorReport {
  name: string;
  message: string;
  stack?: string;
  context: Record<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json() as ErrorReport;
    
    // Log error details for server-side tracking
    console.error('Client Error:', {
      timestamp: new Date().toISOString(),
      ...errorData,
      // Include request details
      url: request.url,
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
    });

    // In a production environment, you would send this to your error tracking service
    // For example: Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // TODO: Implement production error reporting service integration
      // await sendToErrorService(errorData);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling error report:', error);
    return NextResponse.json(
      { error: 'Failed to process error report' },
      { status: 500 }
    );
  }
}