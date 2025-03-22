import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as crypto from 'crypto';

/**
 * ServiceAuthClient provides secure service-to-service communication capabilities.
 * It automatically signs outgoing requests with the appropriate authentication headers
 * to meet the requirements of the ServiceAuthGuard.
 */
@Injectable()
export class ServiceAuthClient {
  private readonly httpClient: AxiosInstance;
  private readonly serviceId: string = 'user-service';
  private readonly serviceKey: string;

  constructor(private readonly configService: ConfigService) {
    // Get service key from configuration
    this.serviceKey = this.configService.get<string>('USER_SERVICE_KEY', '');
    if (!this.serviceKey) {
      console.warn('Warning: USER_SERVICE_KEY is not set. Service authentication will fail.');
    }

    // Create HTTP client with interceptors for authentication
    this.httpClient = axios.create();
    this.httpClient.interceptors.request.use(this.signRequest.bind(this));
  }

  /**
   * Makes an authenticated request to another service
   */
  async request<T = any>(config: any): Promise<T> {
    try {
      const response = await this.httpClient(config);
      return response.data;
    } catch (error) {
      // Enhanced error handling with security context
      if (error.response) {
        // Format error details without exposing sensitive information
        const status = error.response.status;
        const message = error.response.data?.message || 'Service request failed';
        
        throw new Error(`Service request failed with status ${status}: ${message}`);
      }
      throw error;
    }
  }

  /**
   * Signs the outgoing request with authentication headers
   */
  private signRequest(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    // Generate timestamp (in seconds)
    const timestamp = Math.floor(Date.now() / 1000).toString();
    
    // Prepare request components for signature
    const method = config.method?.toUpperCase() || 'GET';
    const path = config.url || '';
    const bodyContent = config.data ? JSON.stringify(config.data) : '';
    
    // Create signature string and sign it
    const signatureContent = `${method}:${path}:${timestamp}:${bodyContent}`;
    const signature = this.createSignature(signatureContent, this.serviceKey);
    
    // Add authentication headers
    config.headers = config.headers || {};
    config.headers['x-service-id'] = this.serviceId;
    config.headers['x-request-timestamp'] = timestamp;
    config.headers['x-request-signature'] = signature;
    
    return config;
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
} 