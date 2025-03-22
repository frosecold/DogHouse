# DogHouse Security Guidelines

This document outlines security best practices and guidelines for the DogHouse application. Security should be integrated into every phase of development, from design to deployment.

## General Security Principles

1. **Defense in Depth**: Implement multiple layers of security controls
2. **Principle of Least Privilege**: Grant minimal access required for functionality
3. **Secure by Default**: Security should be the default configuration
4. **Fail Securely**: Applications should fail in a secure manner
5. **Keep Security Simple**: Avoid complex security mechanisms that are difficult to implement correctly
6. **Fix Security Issues Correctly**: Address root causes, not just symptoms

## Authentication and Authorization

### Authentication

1. **Password Policies**:
   - Enforce minimum password length (10+ characters)
   - Require complexity (lowercase, uppercase, numbers, special characters)
   - Check passwords against common password lists
   - Use secure password hashing (bcrypt with appropriate cost factor)

2. **Multi-Factor Authentication**:
   - Implement MFA for admin accounts
   - Offer MFA as an option for all users
   - Support TOTP or similar standard approaches

3. **Account Recovery**:
   - Implement secure password reset flows
   - Use time-limited, single-use tokens
   - Send notifications when account changes occur

4. **Session Management**:
   - Use JWT with appropriate expiration
   - Implement token refresh mechanism
   - Invalidate tokens on logout or password change
   - Set secure and httpOnly flags for cookies

### Authorization

1. **Role-Based Access Control**:
   - Define clear roles (admin, staff, customer)
   - Implement permission checking in both frontend and backend
   - Use middleware for route protection

2. **API Authorization**:
   - Validate JWT tokens on every request
   - Implement scope-based permissions for APIs
   - Check object-level permissions

3. **Service-to-Service Authentication**:
   - Use client credentials or service tokens
   - Implement mutual TLS where appropriate
   - Validate service identity

## Data Protection

### Sensitive Data Handling

1. **Data Classification**:
   - Identify and classify sensitive data
   - Apply appropriate protection based on classification
   - Minimize storage of sensitive data

2. **Data Encryption**:
   - Encrypt sensitive data at rest
   - Use strong, industry-standard encryption algorithms
   - Implement proper key management

3. **Personal Data Protection**:
   - Comply with privacy regulations (GDPR, CCPA)
   - Implement data minimization principles
   - Provide data export and deletion capabilities

### Transport Security

1. **TLS Configuration**:
   - Use TLS 1.2+ for all connections
   - Configure secure cipher suites
   - Implement HSTS headers
   - Verify certificate validity

2. **API Security**:
   - Use HTTPS for all API endpoints
   - Implement rate limiting
   - Consider API keys for public endpoints

## Input Validation and Output Encoding

1. **Input Validation**:
   - Validate all user inputs (type, format, range, etc.)
   - Implement both client-side and server-side validation
   - Use parameterized queries for database operations

2. **Output Encoding**:
   - Encode user-supplied content before rendering
   - Use context-specific encoding (HTML, JavaScript, CSS)
   - Implement Content Security Policy (CSP) headers

3. **File Upload Security**:
   - Validate file types and sizes
   - Scan uploaded files for malware
   - Store uploaded files outside the web root
   - Use separate domains for user content

## Database Security

1. **Database Access**:
   - Use parameterized queries or ORM to prevent SQL injection
   - Apply least privilege to database users
   - Encrypt sensitive database connections

2. **Database Architecture**:
   - Separate databases by sensitivity level
   - Implement database firewalls
   - Regular database backups

3. **Query Safety**:
   - Avoid dynamic SQL queries
   - Implement query timeouts
   - Use database connection pooling

## Docker and Container Security

1. **Container Building**:
   - Use minimal base images
   - Scan images for vulnerabilities
   - Run containers as non-root users
   - Remove unnecessary tools and packages

2. **Runtime Security**:
   - Set resource limits
   - Use read-only file systems where possible
   - Implement network segmentation
   - Use secrets management

3. **Image Management**:
   - Sign and verify container images
   - Control image sources
   - Use specific version tags, not 'latest'

## Infrastructure Security

1. **Network Security**:
   - Implement network segmentation
   - Use firewalls and security groups
   - Restrict unnecessary ports
   - Implement intrusion detection/prevention

2. **Cloud Security**:
   - Follow cloud provider security best practices
   - Enable audit logging
   - Use IAM with least privilege
   - Encrypt data at rest and in transit

3. **Kubernetes Security**:
   - Use namespaces for isolation
   - Implement network policies
   - Apply security contexts
   - Scan deployments for misconfigurations

## Logging and Monitoring

1. **Security Logging**:
   - Log security-relevant events
   - Include necessary context in logs
   - Protect log integrity
   - Implement log retention policy

2. **Monitoring and Alerting**:
   - Monitor for suspicious activities
   - Set up alerts for security events
   - Implement automated responses where appropriate
   - Regular log review

## Dependency Management

1. **Dependency Security**:
   - Regularly update dependencies
   - Scan dependencies for vulnerabilities
   - Lock dependency versions
   - Minimize dependencies

2. **Supply Chain Security**:
   - Verify package integrity
   - Use private registries where appropriate
   - Implement software bill of materials (SBOM)

## Security Testing

1. **Automated Security Testing**:
   - Integrate security scanning in CI/CD
   - Implement static application security testing (SAST)
   - Use software composition analysis (SCA)
   - Implement dynamic application security testing (DAST)

2. **Manual Security Testing**:
   - Conduct regular security code reviews
   - Perform penetration testing
   - Implement threat modeling

## Incident Response

1. **Preparation**:
   - Define security incident response plan
   - Assign roles and responsibilities
   - Establish communication channels

2. **Detection and Analysis**:
   - Monitor for security incidents
   - Document and classify incidents
   - Preserve evidence

3. **Containment, Eradication, and Recovery**:
   - Implement containment procedures
   - Remove attack vectors
   - Restore systems to normal operation

4. **Post-Incident Activities**:
   - Document lessons learned
   - Update security controls
   - Improve incident response process

## Secure Development Practices

1. **Secure Coding Standards**:
   - Follow language-specific secure coding guidelines
   - Use security linters
   - Enforce code reviews with security focus

2. **Security Training**:
   - Provide security awareness training
   - Keep up-to-date with security trends
   - Share security knowledge within the team

3. **Continuous Improvement**:
   - Regularly review security controls
   - Update security requirements
   - Adapt to new threats

## Security Implementation Examples

### JWT Authentication Implementation

```typescript
// auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    // Never return the password
    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role 
    };
    
    return {
      accessToken: this.jwtService.sign(payload, {
        expiresIn: process.env.JWT_EXPIRATION || '1h',
      }),
      refreshToken: this.jwtService.sign(
        { sub: user.id, tokenType: 'refresh' },
        { expiresIn: '7d' },
      ),
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      
      if (payload.tokenType !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }
      
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      
      return this.login(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
```

### Input Validation Example

```typescript
// create-pet.dto.ts
import { IsString, IsUUID, IsDateString, IsNumber, IsOptional, Length, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePetDto {
  @ApiProperty({ description: 'Pet name', example: 'Buddy' })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiProperty({ description: 'Pet species', example: 'Dog' })
  @IsString()
  @Length(1, 50)
  species: string;

  @ApiProperty({ description: 'Pet breed', example: 'Golden Retriever', required: false })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  breed?: string;

  @ApiProperty({ description: 'Pet birth date', example: '2020-01-15', required: false })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiProperty({ description: 'Pet weight in kg', example: 25.5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  weight?: number;

  @ApiProperty({ description: 'Pet owner ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID(4)
  ownerId: string;
}

// pets.controller.ts
@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'staff', 'customer')
async createPet(@Body() createPetDto: CreatePetDto, @Request() req) {
  // Check if user is owner or has admin/staff role
  if (req.user.role === 'customer' && req.user.id !== createPetDto.ownerId) {
    throw new ForbiddenException('You can only create pets for yourself');
  }
  
  return this.petsService.create(createPetDto);
}
```

### API Rate Limiting Example

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as helmet from 'helmet';
import * as rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Security headers
  app.use(helmet());
  
  // Rate limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later',
    }),
  );
  
  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties not in DTO
      forbidNonWhitelisted: true, // throw error for properties not in DTO
      transform: true, // transform payloads to DTO instances
    }),
  );
  
  // CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('DogHouse API')
    .setDescription('DogHouse Pet Business Management API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
```

## Security Checklist

Before deploying to production, ensure the following security controls are in place:

- [ ] Authentication and authorization implemented properly
- [ ] Input validation applied to all user inputs
- [ ] Output encoding implemented for user-supplied content
- [ ] Sensitive data encrypted at rest and in transit
- [ ] Security headers configured (HSTS, CSP, etc.)
- [ ] Database access secured
- [ ] Dependencies updated and scanned for vulnerabilities
- [ ] Security logging and monitoring in place
- [ ] Rate limiting implemented
- [ ] Docker containers run as non-root
- [ ] Network security configured properly
- [ ] Error handling does not expose sensitive information
- [ ] Secure development practices followed
- [ ] Security testing completed
- [ ] Incident response plan in place

## Resources

- [OWASP Top Ten](https://owasp.org/www-project-top-ten/)
- [OWASP API Security Top Ten](https://owasp.org/www-project-api-security/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [Docker Security](https://docs.docker.com/engine/security/)
- [Kubernetes Security](https://kubernetes.io/docs/concepts/security/) 