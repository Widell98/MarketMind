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

  it('should render error UI when error occurs', () => {
    const originalError = console.error;
    console.error = vi.fn();

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Verify error UI is displayed
    expect(screen.getByText(/Något gick fel/i)).toBeInTheDocument();
    expect(screen.getByText(/Ett oväntat fel inträffade/i)).toBeInTheDocument();

    console.error = originalError;
  });

  it('should have "Try again" button that can be clicked', () => {
    const originalError = console.error;
    console.error = vi.fn();

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error should be displayed
    expect(screen.getByText(/Något gick fel/i)).toBeInTheDocument();

    // Click try again button - should not crash
    const tryAgainButton = screen.getByRole('button', { name: /försök igen/i });
    expect(tryAgainButton).toBeInTheDocument();
    fireEvent.click(tryAgainButton);

    // Button click should reset state internally, but component still shows error
    // since the child component still throws
    expect(screen.getByText(/Något gick fel/i)).toBeInTheDocument();

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

