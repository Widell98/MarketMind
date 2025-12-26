/**
 * Centralized logging utility
 * Provides consistent logging throughout the application with support for
 * different log levels and future integration with error tracking services
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

/**
 * Logger configuration
 * Can be extended in the future to integrate with services like Sentry, LogRocket, etc.
 */
interface LoggerConfig {
  enableConsole: boolean;
  enableRemoteLogging: boolean;
}

const config: LoggerConfig = {
  enableConsole: isDev, // Only log to console in development
  enableRemoteLogging: isProd, // Can enable remote logging in production
};

/**
 * Formats log messages with timestamp and level
 */
function formatMessage(level: LogLevel, ...args: unknown[]): string {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  return `${prefix} ${args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ')}`;
}

/**
 * Sends logs to remote logging service (to be implemented)
 * Can integrate with Sentry, LogRocket, or custom logging service
 */
async function sendToRemoteLogging(level: LogLevel, message: string, context?: Record<string, unknown>): Promise<void> {
  if (!config.enableRemoteLogging) {
    return;
  }

  // TODO: Implement remote logging integration
  // Example: Sentry.captureMessage(message, level);
  // Example: LogRocket.log(level, message, context);
}

/**
 * Logger object with methods for different log levels
 */
export const logger = {
  /**
   * Debug level logging - only in development
   */
  debug: (...args: unknown[]): void => {
    if (!isDev) return;
    
    const message = formatMessage('debug', ...args);
    if (config.enableConsole) {
      console.debug(message);
    }
  },

  /**
   * Info level logging - only in development
   */
  log: (...args: unknown[]): void => {
    if (!isDev) return;
    
    const message = formatMessage('info', ...args);
    if (config.enableConsole) {
      console.log(message);
    }
  },

  /**
   * Info level logging - alias for log
   */
  info: (...args: unknown[]): void => {
    logger.log(...args);
  },

  /**
   * Warning level logging - only in development
   */
  warn: (...args: unknown[]): void => {
    if (!isDev) return;
    
    const message = formatMessage('warn', ...args);
    if (config.enableConsole) {
      console.warn(message);
    }
  },

  /**
   * Error level logging - always logged (important for production debugging)
   */
  error: (...args: unknown[]): void => {
    const message = formatMessage('error', ...args);
    
    // Always log errors to console (even in production for debugging)
    console.error(message);
    
    // Send to remote logging service in production
    if (isProd) {
      sendToRemoteLogging('error', message, {
        args: args.map(arg => 
          arg instanceof Error ? {
            name: arg.name,
            message: arg.message,
            stack: arg.stack,
          } : arg
        ),
      }).catch(err => {
        // Fallback if remote logging fails
        console.error('Failed to send error to remote logging:', err);
      });
    }
  },
};

export default logger;

