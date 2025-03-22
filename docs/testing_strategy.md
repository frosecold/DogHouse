# DogHouse Testing Strategy

This document outlines the testing approach for DogHouse to ensure high-quality, bug-free software that meets requirements.

## Testing Levels

### 1. Unit Testing

Unit tests verify individual components function correctly in isolation.

**Framework**: Jest

**Example Unit Test Template**:

```typescript
// Test for user service
describe('UserService', () => {
  let userService: UserService;
  let userRepositoryMock: MockType<Repository<User>>;

  beforeEach(async () => {
    // Setup mock repository
    userRepositoryMock = {
      findOne: jest.fn(),
      save: jest.fn(),
      // ... other methods
    };

    // Create test module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepositoryMock
        }
      ]
    }).compile();

    userService = module.get<UserService>(UserService);
  });

  it('should find a user by id', async () => {
    // Arrange
    const userId = 1;
    const user = new User();
    user.id = userId;
    user.email = 'test@example.com';
    userRepositoryMock.findOne.mockReturnValue(user);

    // Act
    const result = await userService.findById(userId);

    // Assert
    expect(result).toEqual(user);
    expect(userRepositoryMock.findOne).toHaveBeenCalledWith({ where: { id: userId } });
  });

  // More tests...
});
```

### 2. Integration Testing

Integration tests verify that different components work together correctly.

**Framework**: Jest + Supertest

**Example Integration Test Template**:

```typescript
// Test for user API endpoints
describe('User Controller (integration)', () => {
  let app: INestApplication;
  let userService: UserService;

  beforeEach(async () => {
    // Create test module
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // Import required modules
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User],
          synchronize: true,
        }),
        UserModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userService = moduleFixture.get<UserService>(UserService);
  });

  afterEach(async () => {
    await app.close();
  });

  it('should create a user', () => {
    const userData = {
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      password: 'password123',
    };

    return request(app.getHttpServer())
      .post('/users')
      .send(userData)
      .expect(201)
      .then((response) => {
        expect(response.body).toHaveProperty('id');
        expect(response.body.email).toEqual(userData.email);
        expect(response.body.firstName).toEqual(userData.firstName);
        expect(response.body.lastName).toEqual(userData.lastName);
        expect(response.body).not.toHaveProperty('password'); // Password should not be returned
      });
  });

  // More tests...
});
```

### 3. End-to-End (E2E) Testing

E2E tests verify that entire features work correctly from the user's perspective.

**Framework**: Cypress

**Example E2E Test Template**:

```typescript
// Test for user registration flow
describe('User Registration', () => {
  beforeEach(() => {
    // Visit the registration page
    cy.visit('/register');
  });

  it('should register a new user successfully', () => {
    // Generate a unique email
    const email = `test-${Date.now()}@example.com`;
    
    // Fill in the registration form
    cy.get('[data-testid=first-name-input]').type('John');
    cy.get('[data-testid=last-name-input]').type('Doe');
    cy.get('[data-testid=email-input]').type(email);
    cy.get('[data-testid=password-input]').type('SecurePassword123');
    cy.get('[data-testid=confirm-password-input]').type('SecurePassword123');
    
    // Submit the form
    cy.get('[data-testid=register-button]').click();
    
    // Verify successful registration
    cy.url().should('include', '/login');
    cy.get('[data-testid=success-message]').should('be.visible');
    cy.get('[data-testid=success-message]').should('contain', 'Registration successful');
  });

  // More tests...
});
```

### 4. API Testing

API tests verify that API endpoints behave as expected.

**Framework**: Jest + Supertest

**Example API Test Template**:

```typescript
// Test for pet API endpoints
describe('Pet API', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    // Create test module
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get auth token for test user
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a new pet', async () => {
    const petData = {
      name: 'Buddy',
      species: 'Dog',
      breed: 'Golden Retriever',
      birthDate: '2020-01-15',
    };

    const response = await request(app.getHttpServer())
      .post('/pets')
      .set('Authorization', `Bearer ${authToken}`)
      .send(petData)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toEqual(petData.name);
    expect(response.body.species).toEqual(petData.species);
    expect(response.body.breed).toEqual(petData.breed);
  });

  // More tests...
});
```

### 5. Performance Testing

Performance tests verify that the system performs well under expected load.

**Framework**: k6

**Example Performance Test Template**:

```javascript
// k6 load test for appointment booking
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 }, // Ramp up to 50 users
    { duration: '3m', target: 50 }, // Stay at 50 users
    { duration: '1m', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
  },
};

export default function() {
  const BASE_URL = 'https://staging-api.doghouse.example.com';
  
  // Login and get token
  const loginRes = http.post(`${BASE_URL}/auth/login`, {
    email: 'loadtest@example.com',
    password: 'password123',
  });
  
  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });
  
  const token = loginRes.json('accessToken');
  
  // Book an appointment
  const appointmentData = {
    petId: 1,
    serviceId: 2,
    date: '2023-12-01',
    time: '10:00',
  };
  
  const bookingRes = http.post(`${BASE_URL}/appointments`, JSON.stringify(appointmentData), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  
  check(bookingRes, {
    'booking successful': (r) => r.status === 201,
    'booking response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  sleep(1);
}
```

### 6. Security Testing

Security tests verify that the system is secure against various threats.

**Framework**: OWASP ZAP

**Security Testing Checklist**:

- [ ] Input validation and sanitization
- [ ] Authentication and authorization
- [ ] Session management
- [ ] Data protection
- [ ] API security
- [ ] CSRF protection
- [ ] XSS protection
- [ ] SQL injection protection
- [ ] Secure dependencies
- [ ] Secure configuration

## Test Planning Template

For each feature or component, create a test plan using this template:

```markdown
# Test Plan: [Feature Name]

## Overview
Brief description of the feature being tested.

## Test Objectives
- Objective 1
- Objective 2
- ...

## Test Environment
- Development
- Staging
- Production

## Test Data Requirements
- Data set 1
- Data set 2
- ...

## Test Cases

### Unit Tests
- [ ] Test Case 1: [Description]
- [ ] Test Case 2: [Description]
- ...

### Integration Tests
- [ ] Test Case 1: [Description]
- [ ] Test Case 2: [Description]
- ...

### E2E Tests
- [ ] Test Case 1: [Description]
- [ ] Test Case 2: [Description]
- ...

## Debug/Log Script
[Description of debugging approach and logging strategy]

## Pass/Fail Criteria
- Criteria 1
- Criteria 2
- ...

## Schedule
- Start Date: [Date]
- End Date: [Date]

## Resources
- Tester 1
- Tester 2
- ...

## Risk Assessment
- Risk 1: [Description and Mitigation]
- Risk 2: [Description and Mitigation]
- ...
```

## Test Automation Strategy

1. **CI/CD Integration**
   - Unit and integration tests run on every pull request
   - E2E tests run nightly and before deployments
   - Performance tests run weekly

2. **Test Coverage**
   - Aim for 80%+ unit test coverage
   - Cover all critical paths with integration tests
   - Cover main user flows with E2E tests

3. **Test Data Management**
   - Use test factories to generate test data
   - Reset test environment before tests
   - Use seeded data for consistent testing

4. **Test Reports**
   - Generate test reports for each test run
   - Track test coverage over time
   - Notify team of test failures

## Debug/Log Script Template

For each feature, create a debug/log script using this template:

```typescript
// Example debug/log script for appointment booking feature
import { Logger } from '@nestjs/common';

export class AppointmentDebugger {
  private readonly logger = new Logger(AppointmentDebugger.name);

  constructor(private readonly config: { level: 'debug' | 'info' | 'warn' | 'error' }) {}

  logBookingRequest(appointmentData: any, userId: number) {
    this.logger.log({
      message: 'Appointment booking request received',
      appointmentData,
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  logAvailabilityCheck(date: string, serviceId: number, result: boolean) {
    if (this.config.level === 'debug') {
      this.logger.debug({
        message: 'Availability check',
        date,
        serviceId,
        result,
        timestamp: new Date().toISOString(),
      });
    }
  }

  logBookingSuccess(appointmentId: number, userId: number) {
    this.logger.log({
      message: 'Appointment booked successfully',
      appointmentId,
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  logBookingError(error: any, appointmentData: any, userId: number) {
    this.logger.error({
      message: 'Appointment booking failed',
      error: {
        message: error.message,
        stack: this.config.level === 'debug' ? error.stack : undefined,
      },
      appointmentData,
      userId,
      timestamp: new Date().toISOString(),
    });
  }
}
```

## Test Documentation Standards

1. **Test Documentation**
   - Each test should have a clear purpose
   - Tests should follow the Arrange-Act-Assert pattern
   - Tests should be independent of each other
   - Tests should have clear failure messages

2. **Test Naming**
   - Unit tests: `should [expected behavior] when [condition]`
   - Integration tests: `should [expected behavior] when [condition]`
   - E2E tests: `should allow user to [action]`

3. **Test Organization**
   - Group tests by feature or component
   - Separate unit, integration, and E2E tests
   - Use describe blocks to organize related tests 