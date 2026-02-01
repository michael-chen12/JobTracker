'use client';

import { Component, type ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  /**
   * Custom fallback UI (optional)
   */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /**
   * Callback when error occurs
   */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component following React 18 best practices
 *
 * Catches JavaScript errors in child components, logs them,
 * and displays a fallback UI instead of crashing the component tree.
 *
 * @example
 * // Basic usage
 * <ErrorBoundary>
 *   <ContactCard contact={contact} />
 * </ErrorBoundary>
 *
 * @example
 * // Custom fallback
 * <ErrorBoundary
 *   fallback={(error, reset) => (
 *     <CustomError message={error.message} onRetry={reset} />
 *   )}
 * >
 *   <ApplicationDetail application={app} />
 * </ErrorBoundary>
 *
 * @example
 * // With error logging
 * <ErrorBoundary
 *   onError={(error, errorInfo) => {
 *     logErrorToService(error, errorInfo);
 *   }}
 * >
 *   <Dashboard />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // Default error UI
      return <DefaultErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

/**
 * Default fallback UI for ErrorBoundary
 */
function DefaultErrorFallback({ error, onReset }: { error: Error; onReset: () => void }) {
  return (
    <div className="p-4">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p>{error.message || 'An unexpected error occurred'}</p>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs">Error details</summary>
              <pre className="mt-2 text-xs overflow-auto p-2 bg-slate-900 text-white rounded">
                {error.stack}
              </pre>
            </details>
          )}
          <Button onClick={onReset} variant="outline" size="sm" className="mt-2">
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}

/**
 * Inline error display component (not a boundary)
 * Use for displaying error states in components
 *
 * @example
 * if (error) {
 *   return <ErrorDisplay error={error} onRetry={refetch} />;
 * }
 */
export function ErrorDisplay({
  error,
  onRetry,
  title = 'Error',
}: {
  error: string | Error;
  onRetry?: () => void;
  title?: string;
}) {
  const message = typeof error === 'string' ? error : error.message;

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {message}
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm" className="mt-2">
            Try again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
