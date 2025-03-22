import { Controller, Get } from '@nestjs/common';
import { 
  HealthCheck, 
  HealthCheckService, 
  TypeOrmHealthIndicator, 
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * Controller for health check endpoints
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  /**
   * Comprehensive health check endpoint
   */
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check service health' })
  @ApiResponse({ 
    status: 200, 
    description: 'The service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        info: { type: 'object', example: { database: { status: 'up' } } },
        details: { type: 'object' },
      },
    },
  })
  check() {
    return this.health.check([
      // Database connection check
      () => this.db.pingCheck('database', { timeout: 3000 }),
      
      // Memory usage check
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024), // 150MB
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),   // 150MB
      
      // Disk space check
      () => this.disk.checkStorage('disk', { 
        path: '/', 
        thresholdPercent: 0.75, // 75% threshold
      }),
    ]);
  }

  /**
   * Simple readiness check for Kubernetes
   */
  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Check if service is ready' })
  @ApiResponse({ status: 200, description: 'The service is ready' })
  @ApiResponse({ status: 503, description: 'The service is not ready' })
  readiness() {
    return this.health.check([
      () => this.db.pingCheck('database', { timeout: 3000 }),
    ]);
  }

  /**
   * Simple liveness check for Kubernetes
   */
  @Get('live')
  @HealthCheck()
  @ApiOperation({ summary: 'Check if service is live' })
  @ApiResponse({ status: 200, description: 'The service is live' })
  @ApiResponse({ status: 503, description: 'The service is not live' })
  liveness() {
    return this.health.check([]);
  }
} 