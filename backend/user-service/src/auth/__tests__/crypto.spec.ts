import * as crypto from 'crypto';

describe('Crypto functionality', () => {
  it('should create consistent signatures', () => {
    // Sample data
    const content = 'GET:/test:12345:{}';
    const key = 'test_secret_key';
    
    // Create signatures in two different ways to ensure consistency
    const signature1 = crypto
      .createHmac('sha256', key)
      .update(content)
      .digest('hex');
    
    const signature2 = crypto
      .createHmac('sha256', key)
      .update(content)
      .digest('hex');
    
    // Signatures should match
    expect(signature1).toBe(signature2);
    expect(signature1.length).toBeGreaterThan(0);
    
    // Check time-constant comparison
    const buffA = Buffer.from(signature1, 'hex');
    const buffB = Buffer.from(signature2, 'hex');
    
    expect(crypto.timingSafeEqual(buffA, buffB)).toBe(true);
  });
}); 