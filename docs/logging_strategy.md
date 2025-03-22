# DogHouse Logging Strategy

This document outlines the logging approach for the DogHouse application to ensure proper debugging, monitoring, and troubleshooting capabilities.

## Logging Objectives

1. Provide visibility into application behavior
2. Enable troubleshooting of issues in all environments
3. Support performance monitoring and optimization
4. Ensure proper audit trails for security and compliance
5. Facilitate debugging during development
6. Enable operational monitoring in production

## Logging Levels

The application will use the following log levels:

| Level | Description | Example Use Case |
|-------|-------------|-----------------|
| ERROR | Critical failures that prevent system operation | Database connection failure, API authentication failure |
| WARN  | Non-critical issues that may indicate problems | Rate limiting applied, deprecated API usage |
| INFO  | Normal operational messages | User logged in, appointment created |
| DEBUG | Detailed information for debugging | Request/response payloads, function parameters |
| TRACE | Extremely detailed tracing information | Function entry/exit, variable state changes |

## Log Format

All logs will follow a consistent JSON format:

```json
{
  "timestamp": "2023-06-01T12:34:56.789Z",
  "level": "INFO",
  "service": "appointment-service",
  "traceId": "1234-5678-9abc-def0",
  "userId": "user-123",
  "message": "Appointment created",
  "data": {
    "appointmentId": "appt-456",
    "petId": "pet-789",
    "serviceId": "service-101",
    "scheduledTime": "2023-06-02T15:00:00Z"
  }
}
```

## Required Log Fields

Every log entry must include:

1. **timestamp**: ISO 8601 format with timezone
2. **level**: Log level (ERROR, WARN, INFO, DEBUG, TRACE)
3. **service**: The service or component name
4. **message**: A concise description of the event

## Optional Log Fields

Depending on context, logs should include:

1. **traceId**: A unique identifier for tracking requests across services
2. **userId**: The user associated with the action (when applicable)
3. **requestId**: A unique identifier for the request
4. **data**: Structured data relevant to the event
5. **error**: Error details including message, code, and stack trace (in non-production environments)
6. **duration**: Time taken to complete an operation (for performance logging)

## Sensitive Data Handling

The following types of data must NEVER be logged:

1. Passwords or authentication tokens
2. Credit card numbers or financial information
3. Personal identifiable information (unless properly masked)
4. Security keys or secrets
5. Session identifiers

When logging data that may contain sensitive information:

1. Implement data scrubbing/masking before logging
2. Use placeholder values (e.g., "***" for masked data)
3. Log only relevant portions of objects (not entire objects)

Example of data masking:

```typescript
// Before logging
const maskedData = {
  ...userData,
  password: '***',
  creditCard: maskCreditCard(userData.creditCard),
  ssn: maskSSN(userData.ssn)
};
logger.info('User data updated', { userData: maskedData });
```

## Logging Implementation

### Backend Logging

The backend services will use a centralized logging module:

```typescript
// src/common/logger/logger.service.ts
import { Injectable, LogLevel } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class LoggerService {
  private logger: winston.Logger;
  
  constructor(
    private readonly service: string,
    private readonly config: {
      level: LogLevel;
      isProduction: boolean;
    }
  ) {
    this.logger = winston.createLogger({
      level: config.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: { service },
      transports: [
        new winston.transports.Console(),
        // Additional transports for production
        ...(config.isProduction ? [
          new winston.transports.File({ filename: 'error.log', level: 'error' }),
          new winston.transports.File({ filename: 'combined.log' }),
        ] : []),
      ],
    });
  }

  error(message: string, metadata?: any): void {
    this.logger.error(message, this.prepareMetadata(metadata));
  }

  warn(message: string, metadata?: any): void {
    this.logger.warn(message, this.prepareMetadata(metadata));
  }

  info(message: string, metadata?: any): void {
    this.logger.info(message, this.prepareMetadata(metadata));
  }

  debug(message: string, metadata?: any): void {
    this.logger.debug(message, this.prepareMetadata(metadata));
  }

  trace(message: string, metadata?: any): void {
    this.logger.silly(message, this.prepareMetadata(metadata)); // 'silly' is Winston's equivalent to TRACE
  }

  private prepareMetadata(metadata?: any): any {
    if (!metadata) return {};
    
    // Add trace ID from current request context if available
    const traceId = this.getTraceIdFromContext();
    if (traceId) {
      metadata.traceId = traceId;
    }
    
    // Sanitize sensitive data
    return this.sanitizeMetadata(metadata);
  }

  private getTraceIdFromContext(): string | undefined {
    // Implementation to get trace ID from current execution context
    return undefined; // Placeholder
  }

  private sanitizeMetadata(metadata: any): any {
    // Deep clone to avoid modifying the original object
    const sanitized = JSON.parse(JSON.stringify(metadata));
    
    // List of fields to mask
    const sensitiveFields = [
      'password', 'token', 'secret', 'authorization', 'creditCard',
      'ssn', 'socialSecurityNumber', 'dob', 'dateOfBirth'
    ];
    
    // Recursive function to mask sensitive fields
    const maskSensitiveData = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      
      Object.keys(obj).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (sensitiveFields.some(field => lowerKey.includes(field))) {
          obj[key] = '***';
        } else if (typeof obj[key] === 'object') {
          maskSensitiveData(obj[key]);
        }
      });
    };
    
    maskSensitiveData(sanitized);
    return sanitized;
  }
}
```

### Frontend Logging

The frontend will use a logging service that sends logs to the backend:

```typescript
// src/services/logger.service.ts
export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
  TRACE = 'TRACE',
}

export class LoggerService {
  private static instance: LoggerService;
  private apiUrl: string;
  private applicationName: string;
  private enabled: boolean;
  private level: LogLevel;
  private buffer: any[] = [];
  private bufferSize: number = 10;
  private flushInterval: number = 5000; // 5 seconds
  private intervalId: any;

  private constructor(
    applicationName: string,
    apiUrl: string,
    level: LogLevel = LogLevel.INFO,
    enabled: boolean = true
  ) {
    this.applicationName = applicationName;
    this.apiUrl = apiUrl;
    this.level = level;
    this.enabled = enabled;

    // Set up interval to flush logs
    this.intervalId = setInterval(() => this.flush(), this.flushInterval);

    // Set up window error handling
    window.onerror = (message, source, lineno, colno, error) => {
      this.error('Uncaught exception', {
        message,
        source,
        lineno,
        colno,
        stack: error?.stack,
      });
      return false;
    };

    // Set up unhandled promise rejection handling
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection', {
        reason: event.reason,
        stack: event.reason?.stack,
      });
    });
  }

  public static getInstance(
    applicationName: string = 'doghouse-frontend',
    apiUrl: string = '/api/logs',
    level: LogLevel = LogLevel.INFO,
    enabled: boolean = true
  ): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService(
        applicationName,
        apiUrl,
        level,
        enabled
      );
    }
    return LoggerService.instance;
  }

  public error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, message, data);
  }

  public warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  public info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  public debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  public trace(message: string, data?: any): void {
    this.log(LogLevel.TRACE, message, data);
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (!this.enabled) return;
    if (this.shouldLog(level)) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        service: this.applicationName,
        message,
        data: this.sanitizeData(data),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };
      
      // Add to buffer
      this.buffer.push(logEntry);
      
      // If buffer is full, flush
      if (this.buffer.length >= this.bufferSize) {
        this.flush();
      }
      
      // Also output to console for development
      this.logToConsole(level, message, data);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [
      LogLevel.ERROR,
      LogLevel.WARN,
      LogLevel.INFO,
      LogLevel.DEBUG,
      LogLevel.TRACE,
    ];
    return levels.indexOf(level) <= levels.indexOf(this.level);
  }

  private sanitizeData(data: any): any {
    if (!data) return undefined;
    
    // Clone data to avoid modifying original
    const sanitized = JSON.parse(JSON.stringify(data));
    
    // Fields to mask
    const sensitiveFields = [
      'password', 'token', 'auth', 'jwt', 'secret',
      'creditCard', 'ssn', 'socialSecurity'
    ];
    
    // Recursive function to mask sensitive fields
    const maskSensitiveData = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      
      Object.keys(obj).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (sensitiveFields.some(field => lowerKey.includes(field))) {
          obj[key] = '***';
        } else if (typeof obj[key] === 'object') {
          maskSensitiveData(obj[key]);
        }
      });
    };
    
    maskSensitiveData(sanitized);
    return sanitized;
  }

  private logToConsole(level: LogLevel, message: string, data?: any): void {
    const consoleMessage = `[${level}] ${message}`;
    switch (level) {
      case LogLevel.ERROR:
        console.error(consoleMessage, data);
        break;
      case LogLevel.WARN:
        console.warn(consoleMessage, data);
        break;
      case LogLevel.INFO:
        console.info(consoleMessage, data);
        break;
      case LogLevel.DEBUG:
      case LogLevel.TRACE:
        console.debug(consoleMessage, data);
        break;
    }
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    
    const logs = [...this.buffer];
    this.buffer = [];
    
    try {
      await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logs),
      });
    } catch (error) {
      // If sending logs fails, output to console and don't re-add to buffer
      console.error('Failed to send logs to server', error);
    }
  }

  public dispose(): void {
    clearInterval(this.intervalId);
    this.flush();
  }
}
```

## Log Storage and Aggregation

In development:
- Logs are output to console and files
- Log levels are set to DEBUG or TRACE

In production:
- Logs are sent to a centralized logging system (ELK Stack)
- Structured logs enable advanced querying and analysis
- Log retention policies are applied based on log level and business requirements

## Feature-Specific Logging Requirements

For each new feature, developers must implement:

1. **Contextual Logging**: Include feature-specific context in logs
2. **Comprehensive Coverage**: Log at key entry/exit points and critical operations
3. **Error Details**: Include detailed error information for troubleshooting

## Feature Logging Template

When implementing logging for a new feature, follow this template:

```typescript
// Example for Appointment Booking Feature
import { LoggerService } from '@common/logger/logger.service';

export class AppointmentService {
  private readonly logger = new LoggerService('appointment-service', {
    level: 'info',
    isProduction: process.env.NODE_ENV === 'production',
  });

  async createAppointment(appointmentData: AppointmentDto, userId: string): Promise<Appointment> {
    this.logger.info('Creating appointment', { 
      userId,
      appointmentData: { 
        petId: appointmentData.petId,
        serviceId: appointmentData.serviceId,
        scheduledTime: appointmentData.scheduledTime
      }
    });

    try {
      // Check availability
      const isAvailable = await this.checkAvailability(
        appointmentData.serviceId, 
        appointmentData.scheduledTime
      );
      
      this.logger.debug('Availability check result', { 
        isAvailable,
        serviceId: appointmentData.serviceId,
        scheduledTime: appointmentData.scheduledTime
      });

      if (!isAvailable) {
        this.logger.warn('Appointment slot not available', { 
          serviceId: appointmentData.serviceId,
          scheduledTime: appointmentData.scheduledTime
        });
        throw new Error('Appointment slot not available');
      }

      // Create appointment
      const startTime = Date.now();
      const appointment = await this.appointmentRepository.save({
        ...appointmentData,
        userId,
        status: 'scheduled',
      });
      const duration = Date.now() - startTime;
      
      this.logger.debug('Database operation completed', { duration });
      this.logger.info('Appointment created successfully', { 
        appointmentId: appointment.id,
        userId
      });

      return appointment;
    } catch (error) {
      this.logger.error('Failed to create appointment', {
        error: {
          message: error.message,
          stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
        },
        userId,
        appointmentData: {
          petId: appointmentData.petId,
          serviceId: appointmentData.serviceId,
          scheduledTime: appointmentData.scheduledTime
        }
      });
      
      throw error;
    }
  }

  // Other methods...
}
```

## Monitoring and Alerting

Logs will be used to generate:

1. **Operational Dashboards**: Real-time visibility into system health
2. **Error Alerts**: Notifications for critical errors
3. **Performance Reports**: Insights into system performance
4. **Security Alerts**: Notifications for potential security issues

## Log Analysis

Regular log analysis will be performed to:

1. Identify recurring issues
2. Detect performance bottlenecks
3. Understand user behavior
4. Improve system reliability

## Responsibilities

1. **Developers**: Implement proper logging in all features
2. **DevOps**: Maintain logging infrastructure
3. **QA**: Verify logging functionality in testing
4. **Security Team**: Review logs for security issues

## Compliance Requirements

Logs must comply with:

1. Data protection regulations (GDPR, CCPA)
2. Retention policies
3. Access control requirements
4. Auditability requirements

## Log Configuration

Logging configuration will be managed through:

1. Environment variables
2. Configuration files
3. Dynamic configuration via admin interface

Example configuration:

```typescript
// config/logging.config.ts
export const loggingConfig = {
  level: process.env.LOG_LEVEL || 'info',
  isProduction: process.env.NODE_ENV === 'production',
  transports: {
    console: true,
    file: process.env.NODE_ENV !== 'development',
    elasticsearch: process.env.NODE_ENV === 'production',
  },
  elasticsearch: {
    node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    index: process.env.ELASTICSEARCH_INDEX || 'doghouse-logs',
  },
};
``` 