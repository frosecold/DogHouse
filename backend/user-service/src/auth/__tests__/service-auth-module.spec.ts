import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ServiceAuthModule } from '../service-auth.module';
import { ServiceAuthGuard } from '../service-auth.guard';
import { ServiceAuthClient } from '../service-auth.client';
import { ExecutionContext } from '@nestjs/common';

describe('ServiceAuthModule', () => {
  describe('Normal mode', () => {
    let serviceAuthGuard: ServiceAuthGuard;
    
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [() => ({
              USER_SERVICE_KEY: 'test_key',
            })],
          }),
          ServiceAuthModule,
        ],
      }).compile();
      
      serviceAuthGuard = module.get<ServiceAuthGuard>(ServiceAuthGuard);
    });
    
    it('should be defined', () => {
      expect(serviceAuthGuard).toBeDefined();
    });
  });
  
  describe('Testing mode', () => {
    let serviceAuthGuard: ServiceAuthGuard;
    
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
          }),
          ServiceAuthModule.forTesting(),
        ],
      }).compile();
      
      serviceAuthGuard = module.get<ServiceAuthGuard>(ServiceAuthGuard);
    });
    
    it('should bypass authentication in test mode', async () => {
      // Create a mock execution context
      const mockContext = {} as ExecutionContext;
      
      // The guard should allow all requests in test mode
      const result = await serviceAuthGuard.canActivate(mockContext);
      expect(result).toBe(true);
    });
  });
}); 