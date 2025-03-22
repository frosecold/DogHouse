import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';

/**
 * Module for application health checks
 */
@Module({
  imports: [
    TerminusModule, // Health check library
    HttpModule,     // For HTTP health checks
  ],
  controllers: [HealthController],
})
export class HealthModule {} 