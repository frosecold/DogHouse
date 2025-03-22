# User Service Requirements

## Dependencies
- Node.js v18.19.1
- npm v9.2.0
- PostgreSQL v14 (containerized)

## Node.js Packages
### Production Dependencies
- @nestjs/common
- @nestjs/core
- @nestjs/config
- @nestjs/platform-express
- @nestjs/typeorm
- @nestjs/swagger
- typeorm
- pg
- helmet
- compression
- class-validator
- class-transformer
- uuid
- bcrypt
- jsonwebtoken
- passport
- passport-jwt
- rxjs
- reflect-metadata

### Development Dependencies
- @nestjs/cli
- @nestjs/testing
- @types/express
- @types/node
- @types/uuid
- @types/compression
- @types/helmet
- typescript
- ts-node
- ts-jest
- jest
- supertest

## Environment Configuration
```
# Server Configuration
PORT=3002
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=doghouse_users
DB_SYNCHRONIZE=true
DB_LOGGING=true
DB_SSL=false

# Logging
LOG_LEVEL=debug
LOG_VERBOSE=true

# Security Settings
JWT_SECRET=dev_secret_key_replace_in_production
JWT_EXPIRATION=1h
REFRESH_TOKEN_EXPIRATION=7d
BCRYPT_SALT_ROUNDS=10

# API Gateway Connection
API_GATEWAY_URL=http://localhost:3000
```

## Database Schema
- User entity with fields:
  - id (UUID)
  - email (unique)
  - firstName
  - lastName
  - phoneNumber
  - password (hashed)
  - role
  - isActive
  - createdAt
  - updatedAt

## API Endpoints
- `GET /api/health` - Service health check
- `GET /api/health/ready` - Service readiness check
- `GET /api/health/live` - Service liveness check
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `GET /api/users/:id` - Get specific user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Documentation
- Swagger UI at `/api/docs` 