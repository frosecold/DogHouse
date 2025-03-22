import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * DatabaseEncryptionService provides field-level encryption for sensitive data
 * stored in the database, addressing OWASP's sensitive data exposure risks.
 */
@Injectable()
export class DatabaseEncryptionService {
  private readonly encryptionKey: Buffer;
  private readonly algorithm = 'aes-256-gcm';
  private readonly ivLength = 16; // 16 bytes for AES
  private readonly authTagLength = 16; // 16 bytes for GCM mode

  constructor(private readonly configService: ConfigService) {
    const keyString = this.configService.get<string>('DB_ENCRYPTION_KEY', '');
    
    if (!keyString || keyString.length < 32) {
      console.warn('Warning: DB_ENCRYPTION_KEY is missing or too short. Defaulting to a development key.');
      // Only use this fallback in development
      this.encryptionKey = Buffer.from('dbencryptionsecretkeyfordevelopment', 'utf8');
    } else {
      // Derive a key from the provided string (32 bytes for AES-256)
      this.encryptionKey = Buffer.from(keyString.slice(0, 32), 'utf8');
    }
  }

  /**
   * Encrypts sensitive data before storing in the database
   * Uses AES-256-GCM which provides both confidentiality and authenticity
   */
  encrypt(text: string): string {
    if (!text) return text;
    
    try {
      // Generate a random initialization vector
      const iv = crypto.randomBytes(this.ivLength);
      
      // Create cipher with encryption key and iv
      const cipher = crypto.createCipheriv(
        this.algorithm,
        this.encryptionKey,
        iv
      );
      
      // Encrypt the data
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get authentication tag for GCM mode (data integrity)
      const authTag = cipher.getAuthTag();
      
      // Format: iv:encrypted:authTag
      return Buffer.concat([
        iv,
        Buffer.from(encrypted, 'hex'),
        authTag
      ]).toString('base64');
    } catch (error) {
      console.error('Encryption error:', error.message);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypts data retrieved from the database
   */
  decrypt(encryptedText: string): string {
    if (!encryptedText) return encryptedText;
    
    try {
      // Convert from base64 to buffer
      const buffer = Buffer.from(encryptedText, 'base64');
      
      // Extract iv, encrypted data, and auth tag
      const iv = buffer.slice(0, this.ivLength);
      const authTag = buffer.slice(buffer.length - this.authTagLength);
      const encrypted = buffer.slice(
        this.ivLength,
        buffer.length - this.authTagLength
      );
      
      // Create decipher
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.encryptionKey,
        iv
      );
      
      // Set auth tag
      decipher.setAuthTag(authTag);
      
      // Decrypt
      let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error.message);
      // In case of decryption failure, return a placeholder
      // This prevents information disclosure but allows the app to continue
      return '[Decryption failed]';
    }
  }
} 