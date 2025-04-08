/**
 * Enhanced logger service for Glidebase sync operations
 * Provides consistent logging across frontend and edge functions
 * 
 * @module logger
 */

/**
 * Log levels for controlling verbosity
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Log entry structure for consistent formatting
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: any;
  requestId?: string;
}

/**
 * Logger configuration options
 */
export interface LoggerOptions {
  /** Minimum log level to display */
  minLevel?: LogLevel;
  /** Include timestamps in logs */
  timestamps?: boolean;
  /** Default context for all logs */
  defaultContext?: string;
  /** Enable detailed logging */
  detailed?: boolean;
  /** Request ID for tracing */
  requestId?: string;
}

/**
 * Logger class for consistent logging across the application
 */
export class Logger {
  private minLevel: LogLevel;
  private timestamps: boolean;
  private context: string;
  private detailed: boolean;
  private requestId?: string;
  
  private readonly levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  /**
   * Creates a new logger instance
   * @param options Logger configuration options
   */
  constructor(options: LoggerOptions = {}) {
    this.minLevel = options.minLevel || 'info';
    this.timestamps = options.timestamps !== false;
    this.context = options.defaultContext || 'GlSync';
    this.detailed = options.detailed || false;
    this.requestId = options.requestId;
  }

  /**
   * Sets the minimum log level
   * @param level The minimum log level to display
   */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  /**
   * Sets the context for subsequent log messages
   * @param context The context string
   */
  setContext(context: string): void {
    this.context = context;
  }

  /**
   * Sets the request ID for tracing
   * @param requestId The request ID
   */
  setRequestId(requestId: string): void {
    this.requestId = requestId;
  }

  /**
   * Enables or disables detailed logging
   * @param enabled Whether detailed logging is enabled
   */
  setDetailed(enabled: boolean): void {
    this.detailed = enabled;
  }

  /**
   * Logs a debug message
   * @param message The message to log
   * @param data Optional data to include
   */
  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  /**
   * Logs an info message
   * @param message The message to log
   * @param data Optional data to include
   */
  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  /**
   * Logs a warning message
   * @param message The message to log
   * @param data Optional data to include
   */
  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  /**
   * Logs an error message
   * @param message The message to log
   * @param data Optional data to include
   */
  error(message: string, data?: any): void {
    this.log('error', message, data);
  }

  /**
   * Internal method to log a message with the specified level
   * @param level The log level
   * @param message The message to log
   * @param data Optional data to include
   */
  private log(level: LogLevel, message: string, data?: any): void {
    // Skip if below minimum level
    if (this.levelPriority[level] < this.levelPriority[this.minLevel]) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: this.timestamps ? new Date().toISOString() : '',
      context: this.context
    };

    if (this.requestId) {
      entry.requestId = this.requestId;
    }

    if (data !== undefined && this.detailed) {
      entry.data = data;
    }

    // Format the log entry
    const formattedMessage = this.formatLogEntry(entry);

    // Output to console
    switch (level) {
      case 'debug':
        console.debug(formattedMessage);
        if (data !== undefined && this.detailed) {
          console.debug(data);
        }
        break;
      case 'info':
        console.info(formattedMessage);
        if (data !== undefined && this.detailed) {
          console.info(data);
        }
        break;
      case 'warn':
        console.warn(formattedMessage);
        if (data !== undefined && this.detailed) {
          console.warn(data);
        }
        break;
      case 'error':
        console.error(formattedMessage);
        if (data !== undefined && this.detailed) {
          console.error(data);
        }
        break;
    }
  }

  /**
   * Formats a log entry for display
   * @param entry The log entry to format
   * @returns Formatted log message
   */
  private formatLogEntry(entry: LogEntry): string {
    const parts: string[] = [];

    if (entry.timestamp) {
      parts.push(`[${entry.timestamp}]`);
    }

    parts.push(`[${entry.level.toUpperCase()}]`);

    if (entry.context) {
      parts.push(`[${entry.context}]`);
    }

    if (entry.requestId) {
      parts.push(`[${entry.requestId}]`);
    }

    parts.push(entry.message);

    return parts.join(' ');
  }

  /**
   * Creates a child logger with a specific context
   * @param context The context for the child logger
   * @returns A new logger instance with the specified context
   */
  child(context: string): Logger {
    return new Logger({
      minLevel: this.minLevel,
      timestamps: this.timestamps,
      defaultContext: context,
      detailed: this.detailed,
      requestId: this.requestId
    });
  }

  /**
   * Creates a timer for measuring operation duration
   * @param operationName Name of the operation being timed
   * @returns An object with a stop method to end timing and log the result
   */
  timer(operationName: string) {
    const startTime = Date.now();
    
    return {
      /**
       * Stops the timer and logs the duration
       * @param options Options for the timer stop
       */
      stop: (options: { 
        level?: LogLevel;
        message?: string;
        data?: any;
        logDuration?: boolean;
      } = {}) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        const { 
          level = 'info',
          message = `${operationName} completed`,
          data,
          logDuration = true
        } = options;
        
        const finalMessage = logDuration 
          ? `${message} in ${duration}ms` 
          : message;
          
        this.log(level, finalMessage, {
          ...data,
          duration,
          operation: operationName
        });
        
        return duration;
      }
    };
  }
}

/**
 * Creates a new logger instance with the specified options
 * @param options Logger configuration options
 * @returns A new logger instance
 */
export function createLogger(context: string, options: Omit<LoggerOptions, 'defaultContext'> = {}): Logger {
  return new Logger({
    ...options,
    defaultContext: context
  });
}

/**
 * Default logger instance
 */
export const logger = new Logger();
