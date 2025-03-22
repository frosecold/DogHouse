# DogHouse Backend Security

This document outlines the backend security measures implemented in the DogHouse platform, based on OWASP Top 10 security guidelines.

## 1. Service-to-Service Authentication

Services within our microservices architecture authenticate to each other using HMAC-signed requests:

### Key Components

- **ServiceAuthGuard**: NestJS guard that validates incoming service requests
- **ServiceAuthClient**: Client that automatically signs outgoing requests
- **ServiceAuthModule**: Global module providing authentication capabilities

### Security Measures

- **HMAC-SHA256 Request Signing**: All service-to-service requests are cryptographically signed
- **Request Replay Protection**: Timestamps included in signatures with 5-minute validation window
- **Service Identification**: Each service has a unique ID and secret key
- **Time-Constant Comparison**: Prevents timing attacks when validating signatures

### Configuration

Each service requires API keys to be set in environment variables:
- `USER_SERVICE_KEY`
- `API_GATEWAY_KEY`
- `PET_SERVICE_KEY`
- `AUTH_SERVICE_KEY`

## 2. Database Security

### Connection Security

- **SSL Encryption**: Optional database connection encryption
- **Connection Pooling**: Managed connections with proper timeout settings
- **Query Timeout**: Prevents long-running query attacks
- **Parameterized Queries**: TypeORM uses prepared statements to prevent SQL injection

### Sensitive Data Encryption

The `DatabaseEncryptionService` provides field-level encryption for sensitive data:

- **AES-256-GCM** encryption algorithm (Authenticated Encryption with Associated Data)
- **Unique IV** for each encryption operation
- **Authentication Tags** to ensure data integrity
- **Secure Key Management** using environment variables

## 3. Database Access Patterns

- **Repository Pattern**: Data access is abstracted through repositories
- **Least Privilege**: Database users have limited permissions
- **Query Filtering**: All user inputs are validated and sanitized
- **Data Validation**: DTOs with class-validator ensure data integrity

## 4. OWASP Top 10 Mitigations

### A1: Broken Access Control
- API endpoints protected by service authentication
- Role-based access controls for user endpoints

### A2: Cryptographic Failures
- Strong encryption for sensitive data (AES-256-GCM)
- Secure key management via environment variables
- TLS for all communications

### A3: Injection
- Parameterized queries with TypeORM
- Input validation using class-validator
- Output encoding to prevent XSS

### A4: Insecure Design
- Threat modeling in architecture design
- Security by default for all services
- Fail-secure approach to errors

### A5: Security Misconfiguration
- Environment-based configuration
- Minimal required configuration
- Secure defaults for development

### A6: Vulnerable and Outdated Components
- Regular dependency updates
- Dependency scanning in CI/CD
- Minimal external dependencies

### A7: Identification and Authentication Failures
- Service authentication with HMAC signatures
- Proper error handling without information disclosure
- Request replay protection

### A8: Software and Data Integrity Failures
- Data integrity verification with authentication tags
- Signed requests between services
- Validated dependencies

### A9: Security Logging and Monitoring Failures
- Comprehensive logging for security events
- Error tracking without sensitive information
- Audit logging for security-related operations

### A10: Server-Side Request Forgery
- Restricted outbound traffic
- URL validation for external requests
- Service-level firewalls

## Best Practices Implementation

- **Defense in Depth**: Multiple security layers throughout the application
- **Least Privilege**: Services only have access to required resources
- **Secure Defaults**: Security enabled by default, opt-out when necessary
- **Security Headers**: Implemented via Helmet middleware
- **Error Handling**: Security-focused error responses without information leakage

## Security Testing

- Unit tests for security components
- Regular security scanning
- Penetration testing before production

## Future Enhancements

- API rate limiting
- Web Application Firewall integration
- Advanced threat detection
- Security event monitoring 