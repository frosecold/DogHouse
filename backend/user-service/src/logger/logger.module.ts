import { Module } from '@nestjs/common';
import { CustomLoggerService } from './logger.service';

/**
 * Module for centralized logging
 */
@Module({
  providers: [CustomLoggerService],
  exports: [CustomLoggerService],
})
export class LoggerModule {} 