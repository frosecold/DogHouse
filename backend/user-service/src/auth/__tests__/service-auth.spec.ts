import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServiceAuthGuard } from '../service-auth.guard';
import { ServiceAuthClient } from '../service-auth.client';
import { ExecutionContext } from '@nestjs/common';
import * as crypto from 'crypto';

// Helper function to directly test the signature creation
function createSignature(content: string, key: string): string {
  return crypto
    .createHmac('sha256', key)
    .update(content)
    .digest('hex');
}

describe('Service Authentication', () => {
  let serviceAuthGuard: ServiceAuthGuard;
  let serviceAuthClient: ServiceAuthClient;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          // Mock environment variables for testing
          load: [() => ({
            USER_SERVICE_KEY: 'test_user_service_key',
            API_GATEWAY_KEY: 'test_api_gateway_key',
            PET_SERVICE_KEY: 'test_pet_service_key',
            AUTH_SERVICE_KEY: 'test_auth_service_key',
          })],
        }),
      ],
      providers: [ServiceAuthGuard, ServiceAuthClient],
    }).compile();

    serviceAuthGuard = module.get<ServiceAuthGuard>(ServiceAuthGuard);
    serviceAuthClient = module.get<ServiceAuthClient>(ServiceAuthClient);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('ServiceAuthGuard', () => {
    it('should be defined', () => {
      expect(serviceAuthGuard).toBeDefined();
    });
    
    it('should reject requests with missing headers', async () => {
      // Mock execution context with missing headers
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {},
            method: 'GET',
            path: '/test',
          }),
        }),
      } as unknown as ExecutionContext;
      
      await expect(serviceAuthGuard.canActivate(mockContext)).rejects.toThrow('Missing required authentication headers');
    });
  });

  describe('ServiceAuthClient', () => {
    it('should be defined', () => {
      expect(serviceAuthClient).toBeDefined();
    });
    
    it('should sign requests with authentication headers', async () => {
      // Create a mock axios configuration
      const config = {
        method: 'GET',
        url: '/test-endpoint',
        headers: {},
      };
      
      // Use private method via any type casting to test signing
      const signedConfig = (serviceAuthClient as any).signRequest(config);
      
      // Check that headers were added
      expect(signedConfig.headers['x-service-id']).toBe('user-service');
      expect(signedConfig.headers['x-request-timestamp']).toBeDefined();
      expect(signedConfig.headers['x-request-signature']).toBeDefined();
    });
  });
  
  describe('Manual signature verification', () => {
    it('should validate signatures correctly', async () => {
      // 1. Set up test data
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const method = 'GET';
      const path = '/test-path';
      const bodyContent = '';
      const serviceId = 'user-service';
      const signatureContent = `${method}:${path}:${timestamp}:${bodyContent}`;
      
      // 2. Get the service key
      const serviceKey = configService.get<string>('USER_SERVICE_KEY') || '';
      
      // 3. Create signature
      const signature = createSignature(signatureContent, serviceKey);
      
      // 4. Create mock context with the signed request
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {
              'x-service-id': serviceId,
              'x-request-timestamp': timestamp,
              'x-request-signature': signature,
            },
            method: method,
            path: path,
            body: {},
          }),
        }),
      } as unknown as ExecutionContext;
      
      // 5. Verify the guard accepts this request
      expect(await serviceAuthGuard.canActivate(mockContext)).toBe(true);
    });
  });
}); 