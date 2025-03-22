import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Custom logger service that can be extended for more advanced logging
 * This can be later integrated with tools like Winston or Pino
 */
@Injectable()
export class CustomLoggerService implements LoggerService {
  private context?: string;

  constructor(private configService: ConfigService) {}

  /**
   * Set the context for the logger
   */
  setContext(context: string): void {
    this.context = context;
  }

  /**
   * Log an informational message
   */
  log(message: any, context?: string): void {
    this.printMessage('info', message, context || this.context);
  }

  /**
   * Log an error message
   */
  error(message: any, trace?: string, context?: string): void {
    this.printMessage('error', message, context || this.context);
    if (trace) {
      console.error(trace);
    }
  }

  /**
   * Log a warning message
   */
  warn(message: any, context?: string): void {
    this.printMessage('warn', message, context || this.context);
  }

  /**
   * Log a debug message
   */
  debug(message: any, context?: string): void {
    // Only log debug messages in development
    if (this.configService.get('NODE_ENV') !== 'production') {
      this.printMessage('debug', message, context || this.context);
    }
  }

  /**
   * Log a verbose message
   */
  verbose(message: any, context?: string): void {
    // Only log verbose messages if specifically enabled
    if (this.configService.get('LOG_VERBOSE') === 'true') {
      this.printMessage('verbose', message, context || this.context);
    }
  }

  /**
   * Format and print log message
   */
  private printMessage(level: string, message: any, context?: string): void {
    const now = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    
    // For structured logging in production, we could output JSON instead
    const formattedMessage = typeof message === 'object' 
      ? JSON.stringify(message) 
      : message;
    
    console.log(`${now} [${level.toUpperCase()}] ${contextStr} ${formattedMessage}`);
    
    // Here we could add logic to send logs to external services
    // like Elasticsearch, CloudWatch, etc.
  }
} 