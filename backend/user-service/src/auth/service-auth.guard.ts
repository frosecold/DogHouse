import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as crypto from 'crypto';

/**
 * ServiceAuthGuard provides authentication for internal service-to-service communication.
 * It implements API key-based authentication with HMAC request verification to prevent
 * OWASP vulnerabilities like broken authentication and insecure API endpoints.
 */
@Injectable()
export class ServiceAuthGuard implements CanActivate {
  private readonly apiKeys: Map<string, string>;
  private readonly allowedServices: string[];
  private readonly logger = new Logger(ServiceAuthGuard.name);

  constructor(private readonly configService: ConfigService) {
    // Load service API keys from environment variables
    this.apiKeys = new Map<string, string>([
      ['user-service', this.configService.get<string>('USER_SERVICE_KEY', '')],
      ['api-gateway', this.configService.get<string>('API_GATEWAY_KEY', '')],
      ['pet-service', this.configService.get<string>('PET_SERVICE_KEY', '')],
      ['auth-service', this.configService.get<string>('AUTH_SERVICE_KEY', '')],
      // Add other services as needed
    ]);

    this.allowedServices = Array.from(this.apiKeys.keys());
    
    // Log the available services and keys (don't do this in production)
    if (this.configService.get('NODE_ENV') === 'development') {
      this.logger.debug(`Allowed services: ${this.allowedServices.join(', ')}`);
      this.allowedServices.forEach(service => {
        const key = this.apiKeys.get(service) || '';
        this.logger.debug(`Service ${service} has key: ${key ? 'YES' : 'NO'}`);
      });
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Extract authentication headers
    const serviceId = request.headers['x-service-id'] as string;
    const timestamp = request.headers['x-request-timestamp'] as string;
    const signature = request.headers['x-request-signature'] as string;
    
    // Validate required headers exist
    if (!serviceId || !timestamp || !signature) {
      throw new UnauthorizedException('Missing required authentication headers');
    }
    
    // Validate service is allowed
    if (!this.allowedServices.includes(serviceId)) {
      throw new UnauthorizedException(`Unknown service: ${serviceId}`);
    }
    
    // Validate timestamp to prevent replay attacks (5 minutes window)
    const requestTime = parseInt(timestamp, 10);
    const currentTime = Math.floor(Date.now() / 1000);
    if (isNaN(requestTime) || currentTime - requestTime > 300) {
      throw new UnauthorizedException('Request expired or invalid timestamp');
    }
    
    // Get service API key
    const apiKey = this.apiKeys.get(serviceId);
    if (!apiKey) {
      throw new UnauthorizedException('Invalid service credentials');
    }
    
    // Create signature string from request components
    const method = request.method;
    const path = request.path;
    const bodyContent = JSON.stringify(request.body) || '';
    const signatureContent = `${method}:${path}:${timestamp}:${bodyContent}`;
    
    // Verify HMAC signature
    const expectedSignature = this.createSignature(signatureContent, apiKey);
    
    // In development, log details for debugging
    if (this.configService.get('NODE_ENV') !== 'production') {
      this.logger.debug(`Signature verification:
        Service: ${serviceId}
        Method: ${method}
        Path: ${path}
        Timestamp: ${timestamp}
        Body: ${bodyContent}
        Content to sign: ${signatureContent}
        Provided signature: ${signature}
        Expected signature: ${expectedSignature}
        API Key: ${apiKey.substring(0, 4)}...
      `);
    }
    
    if (!this.safeCompare(signature, expectedSignature)) {
      throw new UnauthorizedException('Invalid signature');
    }
    
    return true;
  }
  
  /**
   * Creates an HMAC signature for request authentication
   */
  private createSignature(content: string, key: string): string {
    return crypto
      .createHmac('sha256', key)
      .update(content)
      .digest('hex');
  }
  
  /**
   * Performs a time-constant string comparison to prevent timing attacks
   */
  private safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    try {
      return crypto.timingSafeEqual(
        Buffer.from(a, 'hex'),
        Buffer.from(b, 'hex')
      );
    } catch (error) {
      this.logger.error(`Error in safeCompare: ${error.message}`);
      return false;
    }
  }
} 