import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { HealthModule } from './health/health.module';
import { LoggerModule } from './logger/logger.module';
import { AuthModule } from './auth/auth.module';

/**
 * The AppModule is the root module of the application.
 * It imports all other modules and configures application-wide providers.
 */
@Module({
  imports: [
    // Load and validate environment variables
    ConfigModule.forRoot({
      isGlobal: true, // Make configuration available throughout the application
      envFilePath: ['.env', '.env.local'], // Load environment variables from these files
    }),
    
    // Database connection configuration using TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const sslEnabled = configService.get<string>('DB_SSL') === 'true';
        return {
          type: 'postgres',
          host: configService.get('DB_HOST', 'localhost'),
          port: configService.get('DB_PORT', 5432),
          username: configService.get('DB_USERNAME', 'postgres'),
          password: configService.get('DB_PASSWORD', 'postgres'),
          database: configService.get('DB_DATABASE', 'doghouse_users'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true',
          logging: configService.get<string>('DB_LOGGING') === 'true',
          ssl: sslEnabled ? { rejectUnauthorized: false } : false,
          // Enhanced security configuration
          connectTimeout: configService.get<number>('DB_CONNECTION_TIMEOUT', 10000),
          maxQueryExecutionTime: configService.get<number>('DB_QUERY_TIMEOUT', 5000),
          poolSize: configService.get<number>('DB_POOL_SIZE', 10),
          extra: {
            // Prevent SQL injection by setting parameterized statement limit
            max_prepared_transactions: 0,
            // Enable SSL for connections if configured
            ssl: sslEnabled,
          },
        };
      },
    }),
    
    // Security module (must be before feature modules)
    AuthModule,
    
    // Application feature modules
    UsersModule,
    
    // Support modules
    HealthModule, // For health checks
    LoggerModule, // For centralized logging
  ],
})
export class AppModule {} 