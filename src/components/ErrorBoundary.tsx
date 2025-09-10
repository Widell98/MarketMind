import { Component, ErrorInfo, PropsWithChildren } from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

type ErrorBoundaryProps = PropsWithChildren<Record<string, never>>;

/**
 * Simple error logging function, can be replaced with Sentry/LogRocket/etc.
 */
function logError(error: Error, info: ErrorInfo) {
  console.error("ErrorBoundary caught an error:", error, info);
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logError(error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center p-4 text-center">
          <h1 className="mb-4 text-2xl font-bold">Something went wrong.</h1>
          <p className="mb-4">An unexpected error occurred. Please try again.</p>
          <button
            type="button"
            className="rounded bg-primary px-4 py-2 text-white"
            onClick={this.handleReset}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
