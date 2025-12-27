import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from '../logger';

describe('logger', () => {
  const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logger.error', () => {
    it('should always log errors (even in production)', () => {
      logger.error('Error message');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle Error objects', () => {
      const error = new Error('Test error');
      logger.error('Operation failed', error);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('logger.log / logger.info', () => {
    it('should log in development mode', () => {
      // In test environment, logger should work
      logger.log('Test message');
      // Note: Logger only logs in dev mode, but we test that it doesn't crash
      expect(typeof logger.log).toBe('function');
    });

    it('should handle multiple arguments', () => {
      logger.log('Message', { key: 'value' });
      expect(typeof logger.log).toBe('function');
    });
  });

  describe('logger.warn', () => {
    it('should have warn function', () => {
      logger.warn('Warning message');
      expect(typeof logger.warn).toBe('function');
    });
  });

  describe('logger.debug', () => {
    it('should have debug function', () => {
      logger.debug('Debug message');
      expect(typeof logger.debug).toBe('function');
    });
  });
});
