export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  userId?: string;
  requestId?: string;
}

class Logger {
  private isProduction = process.env.NODE_ENV === 'production';
  private logLevel = process.env.LOG_LEVEL || LogLevel.INFO;

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    const currentLevelIndex = levels.indexOf(this.logLevel as LogLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  private formatMessage(entry: LogEntry): string {
    const baseMessage = `[${entry.timestamp}] ${entry.level}: ${entry.message}`;
    
    if (entry.context) {
      return `${baseMessage} | Context: ${JSON.stringify(entry.context)}`;
    }
    
    if (entry.userId || entry.requestId) {
      const meta = { userId: entry.userId, requestId: entry.requestId };
      return `${baseMessage} | Meta: ${JSON.stringify(meta)}`;
    }
    
    return baseMessage;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    if (this.isProduction) {
      // In production, we want structured logging
      console.log(JSON.stringify(entry));
    } else {
      // In development, we want readable logs
      const formattedMessage = this.formatMessage(entry);
      
      switch (level) {
        case LogLevel.ERROR:
          console.error(formattedMessage);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage);
          break;
        case LogLevel.INFO:
          console.log(formattedMessage);
          break;
        case LogLevel.DEBUG:
          console.debug(formattedMessage);
          break;
      }
    }
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  // API-specific logging helpers
  apiError(endpoint: string, error: Error, userId?: string): void {
    this.error(`API Error at ${endpoint}`, {
      error: error.message,
      stack: error.stack,
      userId,
    });
  }

  apiRequest(endpoint: string, method: string, userId?: string): void {
    this.debug(`API Request: ${method} ${endpoint}`, { userId });
  }

  apiResponse(endpoint: string, statusCode: number, duration?: number): void {
    this.info(`API Response: ${endpoint} - ${statusCode}`, {
      statusCode,
      duration,
    });
  }
}

export const logger = new Logger();
