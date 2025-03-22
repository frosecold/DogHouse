import { Module, Global, DynamicModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServiceAuthGuard } from './service-auth.guard';
import { ServiceAuthClient } from './service-auth.client';

/**
 * This module provides service-to-service authentication for internal API security.
 * It's marked as global to make the ServiceAuthGuard available throughout the application.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [ServiceAuthGuard],
  exports: [ServiceAuthGuard],
})
export class ServiceAuthModule {
  /**
   * Setup service auth module with testing mode
   * During testing, this allows bypassing signature verification
   */
  static forTesting(): DynamicModule {
    return {
      module: ServiceAuthModule,
      providers: [
        {
          provide: ServiceAuthGuard,
          useValue: {
            canActivate: jest.fn().mockImplementation(() => true),
          },
        },
        ServiceAuthClient,
      ],
      exports: [ServiceAuthGuard, ServiceAuthClient],
    };
  }
} 