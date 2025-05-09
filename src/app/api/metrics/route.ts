import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface PerformanceMetrics {
  timeToFirstByte?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;
}

interface MetricsPayload {
  componentName: string;
  metrics: PerformanceMetrics;
  timestamp: number;
}

// In-memory metrics storage (replace with a proper database in production)
const metricsStore: MetricsPayload[] = [];
const MAX_METRICS_ENTRIES = 1000;

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json() as MetricsPayload;

    // Validate payload
    if (!payload.componentName || !payload.metrics || !payload.timestamp) {
      return NextResponse.json(
        { error: 'Invalid metrics payload' },
        { status: 400 }
      );
    }

    // Store metrics
    metricsStore.push(payload);

    // Keep metrics store size under control
    if (metricsStore.length > MAX_METRICS_ENTRIES) {
      metricsStore.splice(0, metricsStore.length - MAX_METRICS_ENTRIES);
    }

    // In production, you would send these metrics to your analytics service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Implement production metrics service integration
      // await sendToAnalyticsService(payload);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing metrics:', error);
    return NextResponse.json(
      { error: 'Failed to process metrics' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Only allow metrics retrieval in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Metrics retrieval not available in production' },
      { status: 403 }
    );
  }

  const url = new URL(request.url);
  const component = url.searchParams.get('component');
  const limit = parseInt(url.searchParams.get('limit') || '100');

  let filteredMetrics = metricsStore;
  if (component) {
    filteredMetrics = metricsStore.filter(m => m.componentName === component);
  }

  // Return most recent metrics first
  const metrics = filteredMetrics
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);

  return NextResponse.json({
    metrics,
    total: filteredMetrics.length
  });
}