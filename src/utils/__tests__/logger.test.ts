import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../logger';

describe('logger', () => {
  const originalEnv = import.meta.env;
  const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('logger.log / logger.info', () => {
    it('should log in development mode', () => {
      Object.defineProperty(import.meta, 'env', {
        value: { ...originalEnv, DEV: true },
        writable: true,
        configurable: true,
      });

      logger.log('Test message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should not log in production mode', () => {
      Object.defineProperty(import.meta, 'env', {
        value: { ...originalEnv, DEV: false, PROD: true },
        writable: true,
        configurable: true,
      });

      logger.log('Test message');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should format messages with timestamp and level', () => {
      Object.defineProperty(import.meta, 'env', {
        value: { ...originalEnv, DEV: true },
        writable: true,
        configurable: true,
      });

      logger.log('Test message');
      const call = consoleLogSpy.mock.calls[0][0];
      expect(call).toContain('[INFO]');
      expect(call).toContain('Test message');
    });

    it('should handle multiple arguments', () => {
      Object.defineProperty(import.meta, 'env', {
        value: { ...originalEnv, DEV: true },
        writable: true,
        configurable: true,
      });

      logger.log('Message', { key: 'value' });
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('logger.warn', () => {
    it('should warn in development mode', () => {
      Object.defineProperty(import.meta, 'env', {
        value: { ...originalEnv, DEV: true },
        writable: true,
        configurable: true,
      });

      logger.warn('Warning message');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should not warn in production mode', () => {
      Object.defineProperty(import.meta, 'env', {
        value: { ...originalEnv, DEV: false, PROD: true },
        writable: true,
        configurable: true,
      });

      logger.warn('Warning message');
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe('logger.error', () => {
    it('should always log errors, even in production', () => {
      Object.defineProperty(import.meta, 'env', {
        value: { ...originalEnv, DEV: false, PROD: true },
        writable: true,
        configurable: true,
      });

      logger.error('Error message');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should format error messages with timestamp and level', () => {
      Object.defineProperty(import.meta, 'env', {
        value: { ...originalEnv, DEV: false, PROD: true },
        writable: true,
        configurable: true,
      });

      logger.error('Error message');
      const call = consoleErrorSpy.mock.calls[0][0];
      expect(call).toContain('[ERROR]');
      expect(call).toContain('Error message');
    });

    it('should handle Error objects', () => {
      Object.defineProperty(import.meta, 'env', {
        value: { ...originalEnv, DEV: false, PROD: true },
        writable: true,
        configurable: true,
      });

      const error = new Error('Test error');
      logger.error('Operation failed', error);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('logger.debug', () => {
    it('should debug in development mode', () => {
      Object.defineProperty(import.meta, 'env', {
        value: { ...originalEnv, DEV: true },
        writable: true,
        configurable: true,
      });

      logger.debug('Debug message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should not debug in production mode', () => {
      Object.defineProperty(import.meta, 'env', {
        value: { ...originalEnv, DEV: false, PROD: true },
        writable: true,
        configurable: true,
      });

      logger.debug('Debug message');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });
});

