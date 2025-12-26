import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Component, ReactNode } from 'react';
import ErrorBoundary from '../ErrorBoundary';
import { logger } from '@/utils/logger';

// Component that throws an error
class ThrowError extends Component<{ shouldThrow?: boolean }> {
  render() {
    if (this.props.shouldThrow) {
      throw new Error('Test error');
    }
    return <div>No error</div>;
  }
}

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error from React error boundary
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should catch errors and display error UI', () => {
    // Suppress React error boundary warnings
    const originalError = console.error;
    console.error = vi.fn();

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Något gick fel/i)).toBeInTheDocument();
    expect(screen.getByText(/Ett oväntat fel inträffade/i)).toBeInTheDocument();
    expect(logger.error).toHaveBeenCalled();

    console.error = originalError;
  });

  it('should display error ID when error occurs', () => {
    const originalError = console.error;
    console.error = vi.fn();

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const errorIdText = screen.getByText(/Fel-ID:/i);
    expect(errorIdText).toBeInTheDocument();

    console.error = originalError;
  });

  it('should show error details when in development mode', () => {
    const originalError = console.error;
    console.error = vi.fn();

    // Mock import.meta.env.DEV
    const originalEnv = import.meta.env.DEV;
    Object.defineProperty(import.meta.env, 'DEV', {
      value: true,
      writable: true,
      configurable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Try to find error details - they may or may not be visible depending on DEV mode
    const details = screen.queryByText(/Felinformation/i);
    // In dev mode, details should be present
    if (import.meta.env.DEV) {
      expect(details).toBeInTheDocument();
    }

    // Restore
    Object.defineProperty(import.meta.env, 'DEV', {
      value: originalEnv,
      writable: true,
      configurable: true,
    });
    console.error = originalError;
  });

  it('should reset error state when "Try again" button is clicked', () => {
    const originalError = console.error;
    console.error = vi.fn();

    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error should be displayed
    expect(screen.getByText(/Något gick fel/i)).toBeInTheDocument();

    // Click try again button
    const tryAgainButton = screen.getByRole('button', { name: /försök igen/i });
    fireEvent.click(tryAgainButton);

    // Should re-render without error (component won't throw again)
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.queryByText(/Något gick fel/i)).not.toBeInTheDocument();

    console.error = originalError;
  });

  it('should call logger.error when error occurs', () => {
    const originalError = console.error;
    console.error = vi.fn();

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(logger.error).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('ErrorBoundary'),
      expect.any(Object)
    );

    console.error = originalError;
  });
});

