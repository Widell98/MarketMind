import { Component, ErrorInfo, PropsWithChildren } from "react";
import { logger } from "@/utils/logger";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

type ErrorBoundaryProps = PropsWithChildren<Record<string, never>>;

/**
 * Generates a unique error ID for tracking
 */
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Logs error with full context for debugging
 */
function logError(error: Error, info: ErrorInfo, errorId: string): void {
  logger.error('ErrorBoundary caught an error', {
    errorId,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    componentStack: info.componentStack,
    errorBoundary: true,
  });
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = generateErrorId();
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    const errorId = this.state.errorId || generateErrorId();
    logError(error, info, errorId);
    
    // Store error info for display in development
    this.setState({ errorInfo: info, errorId });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, errorId: undefined });
  };

  handleReportError = (): void => {
    const { error, errorInfo, errorId } = this.state;
    if (!error || !errorId) return;

    // TODO: Implement error reporting service integration
    // Example: Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo?.componentStack } } });
    // Example: window.location.href = `/report-error?errorId=${errorId}`;
    
    logger.info('Error report requested', { errorId });
    
    // For now, copy error details to clipboard
    const errorDetails = `
Error ID: ${errorId}
Error: ${error.name}: ${error.message}
Stack: ${error.stack}
Component Stack: ${errorInfo?.componentStack || 'N/A'}
    `.trim();
    
    navigator.clipboard.writeText(errorDetails).then(() => {
      alert('Error details copied to clipboard. Please share this with support.');
    }).catch(() => {
      // Fallback if clipboard API is not available
      logger.warn('Could not copy error details to clipboard');
    });
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorId } = this.state;
      const isDev = import.meta.env.DEV;

      return (
        <div className="flex h-screen w-full flex-col items-center justify-center p-4 text-center bg-background">
          <div className="max-w-2xl w-full space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-destructive">
                Något gick fel
              </h1>
              <p className="text-muted-foreground">
                Ett oväntat fel inträffade. Vänligen försök igen.
              </p>
              {errorId && (
                <p className="text-sm text-muted-foreground font-mono">
                  Fel-ID: {errorId}
                </p>
              )}
            </div>

            {isDev && error && (
              <div className="mt-6 p-4 bg-muted rounded-lg text-left text-sm">
                <details className="space-y-2">
                  <summary className="font-semibold cursor-pointer mb-2">
                    Felinformation (endast synlig i utvecklingsläge)
                  </summary>
                  <div className="space-y-2 font-mono text-xs break-all">
                    <div>
                      <strong>Fel:</strong> {error.name}
                    </div>
                    <div>
                      <strong>Meddelande:</strong> {error.message}
                    </div>
                    {error.stack && (
                      <div>
                        <strong>Stack Trace:</strong>
                        <pre className="whitespace-pre-wrap mt-1 p-2 bg-background rounded border overflow-auto max-h-40">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                    {errorInfo?.componentStack && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="whitespace-pre-wrap mt-1 p-2 bg-background rounded border overflow-auto max-h-40">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                className="rounded-md bg-primary px-6 py-2 text-primary-foreground hover:bg-primary/90 transition-colors"
                onClick={this.handleReset}
              >
                Försök igen
              </button>
              <button
                type="button"
                className="rounded-md border border-input bg-background px-6 py-2 hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={this.handleReportError}
              >
                Rapportera fel
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
