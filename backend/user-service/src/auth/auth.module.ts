import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServiceAuthModule } from './service-auth.module';
import { ServiceAuthClient } from './service-auth.client';
import { DatabaseEncryptionService } from './database-encryption.service';

/**
 * The AuthModule combines all security components for the application.
 * It's marked as global to make security services available throughout the application.
 */
@Global()
@Module({
  imports: [
    ConfigModule,
    ServiceAuthModule,
  ],
  providers: [
    ServiceAuthClient,
    DatabaseEncryptionService,
  ],
  exports: [
    ServiceAuthClient,
    DatabaseEncryptionService,
  ],
})
export class AuthModule {} 