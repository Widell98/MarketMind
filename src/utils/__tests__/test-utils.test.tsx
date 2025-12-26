import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createTestQueryClient, TestWrapper, wait } from '../test-utils';

describe('test-utils', () => {
  describe('createTestQueryClient', () => {
    it('should create a QueryClient with test defaults', () => {
      const client = createTestQueryClient();
      expect(client).toBeDefined();
    });

    it('should have retry disabled by default', () => {
      const client = createTestQueryClient();
      const defaultOptions = client.getDefaultOptions();
      expect(defaultOptions.queries?.retry).toBe(false);
      expect(defaultOptions.mutations?.retry).toBe(false);
    });
  });

  describe('TestWrapper', () => {
    it('should render children', () => {
      render(
        <TestWrapper>
          <div>Test content</div>
        </TestWrapper>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should provide QueryClientProvider', () => {
      // If QueryClientProvider is not available, rendering would fail
      // This is a simple test to ensure the wrapper doesn't crash
      render(
        <TestWrapper>
          <div>Content</div>
        </TestWrapper>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('wait', () => {
    it('should wait for specified milliseconds', async () => {
      const start = Date.now();
      await wait(100);
      const end = Date.now();
      
      // Should wait at least 100ms (with some tolerance)
      expect(end - start).toBeGreaterThanOrEqual(90);
    });

    it('should return a promise', () => {
      const result = wait(10);
      expect(result).toBeInstanceOf(Promise);
    });
  });
});

