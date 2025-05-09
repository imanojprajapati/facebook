'use client';

import React, { Component, ErrorInfo } from 'react';
import { useLiveAnnouncer } from './LiveAnnouncer';
import { error } from '@/utils/error-reporting';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    error('Error caught by ErrorBoundary:', {
      error,
      errorInfo,
      location: window.location.href
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          onReset={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  const { announce } = useLiveAnnouncer();

  React.useEffect(() => {
    announce('An error has occurred. Please try refreshing the page.', true);
  }, [announce]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="p-4 m-4 bg-red-50 border border-red-200 rounded-lg"
    >
      <h2 className="text-lg font-semibold text-red-800 mb-2">
        Something went wrong
      </h2>
      <p className="text-red-600 mb-4">
        {error?.message || 'An unexpected error occurred'}
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Refresh Page
        </button>
        <button
          onClick={onReset}
          className="px-4 py-2 border border-red-600 text-red-600 rounded hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}