import { useEffect, useRef } from 'react';
import { errorReporter } from '@/utils/error-reporting';

interface PerformanceMetrics {
  timeToFirstByte?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;
}

export function usePerformanceMonitoring(componentName: string) {
  const metricsRef = useRef<PerformanceMetrics>({});

  useEffect(() => {
    try {
      // Only run in production and if the Performance API is available
      if (process.env.NODE_ENV !== 'production' || !performance) return;

      // Time to First Byte (TTFB)
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        metricsRef.current.timeToFirstByte = navigationEntry.responseStart - navigationEntry.requestStart;
      }

      // First Contentful Paint (FCP)
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        metricsRef.current.firstContentfulPaint = fcpEntry.startTime;
      }

      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        metricsRef.current.largestContentfulPaint = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((entryList) => {
        const firstInput = entryList.getEntries()[0] as PerformanceEventTiming;
        metricsRef.current.firstInputDelay = firstInput.processingStart - firstInput.startTime;
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      let cumulativeLayoutShift = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries() as PerformanceEntry[]) {
          if (!(entry as any).hadRecentInput) {
            cumulativeLayoutShift += (entry as any).value;
            metricsRef.current.cumulativeLayoutShift = cumulativeLayoutShift;
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // Report metrics after component unmounts
      return () => {
        // Clean up observers
        lcpObserver.disconnect();
        fidObserver.disconnect();
        clsObserver.disconnect();

        // Report metrics
        fetch('/api/metrics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            componentName,
            metrics: metricsRef.current,
            timestamp: Date.now(),
          }),
        }).catch(error => {
          errorReporter.report(error);
        });
      };
    } catch (error) {
      errorReporter.report(error as Error);
    }
  }, [componentName]);

  // Function to manually record a performance mark
  const recordMark = (markName: string) => {
    try {
      if (performance?.mark) {
        performance.mark(`${componentName}-${markName}`);
      }
    } catch (error) {
      errorReporter.report(error as Error);
    }
  };

  // Function to measure between two marks
  const measureMarks = (startMark: string, endMark: string, measureName: string) => {
    try {
      if (performance?.measure) {
        performance.measure(
          `${componentName}-${measureName}`,
          `${componentName}-${startMark}`,
          `${componentName}-${endMark}`
        );
      }
    } catch (error) {
      errorReporter.report(error as Error);
    }
  };

  return {
    recordMark,
    measureMarks
  };
}