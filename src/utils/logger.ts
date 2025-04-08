/**
 * Logger utility for consistent logging across the application
 * Provides different log levels and contextual information
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  context?: string;
  data?: any;
  timestamp?: boolean;
}

/**
 * Creates a formatted log message with contextual information
 */
const createLogMessage = (
  level: LogLevel,
  message: string,
  options: LogOptions = {}
): string => {
  const { context, timestamp = true } = options;
  const timeStr = timestamp ? `[${new Date().toISOString()}]` : '';
  const contextStr = context ? `[${context}]` : '';
  return `${timeStr} ${level.toUpperCase()} ${contextStr} ${message}`;
};

/**
 * Logs a message to the console with optional data
 */
const log = (
  level: LogLevel,
  message: string,
  options: LogOptions = {}
): void => {
  const { data } = options;
  const formattedMessage = createLogMessage(level, message, options);
  
  switch (level) {
    case 'debug':
      if (process.env.NODE_ENV !== 'production') {
        console.debug(formattedMessage);
        if (data) console.debug(data);
      }
      break;
    case 'info':
      console.info(formattedMessage);
      if (data) console.info(data);
      break;
    case 'warn':
      console.warn(formattedMessage);
      if (data) console.warn(data);
      break;
    case 'error':
      console.error(formattedMessage);
      if (data) console.error(data);
      break;
  }
};

/**
 * Creates a logger instance with a specific context
 */
export const createLogger = (defaultContext: string) => ({
  debug: (message: string, data?: any) => 
    log('debug', message, { context: defaultContext, data }),
  info: (message: string, data?: any) => 
    log('info', message, { context: defaultContext, data }),
  warn: (message: string, data?: any) => 
    log('warn', message, { context: defaultContext, data }),
  error: (message: string, data?: any) => 
    log('error', message, { context: defaultContext, data }),
});

/**
 * Default logger instance
 */
export const logger = {
  debug: (message: string, options?: LogOptions) => log('debug', message, options),
  info: (message: string, options?: LogOptions) => log('info', message, options),
  warn: (message: string, options?: LogOptions) => log('warn', message, options),
  error: (message: string, options?: LogOptions) => log('error', message, options),
};
