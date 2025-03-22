#!/bin/bash

# Exit on error
set -e

# Print commands
set -x

# Define color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Initializing DogHouse project...${NC}"

# Create directory structure
echo -e "${BLUE}Creating directory structure...${NC}"
mkdir -p DogHouse/{backend/{api-gateway,auth-service,user-service,pet-service},frontend,docs,tests/{unit,integration,e2e},scripts,deployment,config}

# Create backend service directories
for service in api-gateway auth-service user-service pet-service; do
  mkdir -p DogHouse/backend/$service/{src/{common,config,controllers,services,models,dtos,interfaces},test,migrations}
done

# Create frontend directories
mkdir -p DogHouse/frontend/{public,src/{app,components/{common,layout,forms},features/{auth,users,pets},services,utils,routes,hooks},test}

# Initialize Git repository
echo -e "${BLUE}Initializing Git repository...${NC}"
cd DogHouse
git init
git branch -M main
git checkout -b develop

# Create .gitignore file
echo -e "${BLUE}Creating .gitignore file...${NC}"
cat > .gitignore << EOF
# Dependencies
node_modules/
.pnp/
.pnp.js

# Build outputs
dist/
build/
out/
.next/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Editor directories and files
.idea/
.vscode/
*.swp
*.swo
.DS_Store

# Testing
coverage/
.nyc_output/

# Docker volumes
data/

# Misc
.cache/
public/
tmp/
temp/
EOF

# Create initial backend package.json files
echo -e "${BLUE}Creating backend package.json files...${NC}"
for service in api-gateway auth-service user-service pet-service; do
  cat > backend/$service/package.json << EOF
{
  "name": "@doghouse/$service",
  "version": "0.1.0",
  "description": "DogHouse $service",
  "main": "dist/main.js",
  "scripts": {
    "prebuild": "rimraf dist",
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main.js",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "migrations:generate": "typeorm migration:generate -n",
    "migrations:run": "typeorm migration:run",
    "migrations:revert": "typeorm migration:revert"
  },
  "dependencies": {
    "@nestjs/common": "^9.0.0",
    "@nestjs/config": "^2.2.0",
    "@nestjs/core": "^9.0.0",
    "@nestjs/platform-express": "^9.0.0",
    "@nestjs/swagger": "^6.1.4",
    "@nestjs/typeorm": "^9.0.1",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "pg": "^8.8.0",
    "reflect-metadata": "^0.1.13",
    "rimraf": "^4.1.2",
    "rxjs": "^7.5.7",
    "typeorm": "^0.3.11"
  },
  "devDependencies": {
    "@nestjs/cli": "^9.1.8",
    "@nestjs/schematics": "^9.0.4",
    "@nestjs/testing": "^9.2.1",
    "@types/express": "^4.17.15",
    "@types/jest": "^29.2.5",
    "@types/node": "^18.11.18",
    "@types/supertest": "^2.0.12",
    "@typescript-eslint/eslint-plugin": "^5.48.1",
    "@typescript-eslint/parser": "^5.48.1",
    "eslint": "^8.31.0",
    "eslint-config-prettier": "^8.6.0",
    "eslint-plugin-prettier": "^4.2.1",
    "jest": "^29.3.1",
    "prettier": "^2.8.2",
    "source-map-support": "^0.5.21",
    "supertest": "^6.3.3",
    "ts-jest": "^29.0.3",
    "ts-loader": "^9.4.2",
    "ts-node": "^10.9.1",
    "tsconfig-paths": "^4.1.2",
    "typescript": "^4.9.4"
  },
  "jest": {
    "moduleFileExtensions": [
      "js",
      "json",
      "ts"
    ],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": [
      "**/*.(t|j)s"
    ],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
EOF

  # Create tsconfig.json
  cat > backend/$service/tsconfig.json << EOF
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "es2017",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false,
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
EOF

  # Create .env.example
  cat > backend/$service/.env.example << EOF
# Application
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# Database
DATABASE_URL=postgres://postgres:postgres@postgres:5432/doghouse
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=doghouse

# JWT (for auth-service)
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=8h

# Services (for api-gateway)
AUTH_SERVICE_URL=http://auth-service:3001
USER_SERVICE_URL=http://user-service:3002
PET_SERVICE_URL=http://pet-service:3003

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
EOF
done

# Create frontend package.json
echo -e "${BLUE}Creating frontend package.json...${NC}"
cat > frontend/package.json << EOF
{
  "name": "@doghouse/frontend",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@emotion/react": "^11.10.5",
    "@emotion/styled": "^11.10.5",
    "@mui/icons-material": "^5.11.0",
    "@mui/material": "^5.11.4",
    "@reduxjs/toolkit": "^1.9.1",
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/react": "^13.4.0",
    "@testing-library/user-event": "^14.4.3",
    "axios": "^1.2.2",
    "formik": "^2.2.9",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-redux": "^8.0.5",
    "react-router-dom": "^6.6.2",
    "react-scripts": "5.0.1",
    "web-vitals": "^3.1.1",
    "yup": "^0.32.11"
  },
  "devDependencies": {
    "@types/jest": "^29.2.5",
    "@types/node": "^18.11.18",
    "@types/react": "^18.0.26",
    "@types/react-dom": "^18.0.10",
    "@types/react-router-dom": "^5.3.3",
    "@typescript-eslint/eslint-plugin": "^5.48.1",
    "@typescript-eslint/parser": "^5.48.1",
    "cypress": "^12.3.0",
    "eslint": "^8.31.0",
    "eslint-config-prettier": "^8.6.0",
    "eslint-plugin-prettier": "^4.2.1",
    "eslint-plugin-react": "^7.32.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "prettier": "^2.8.2",
    "typescript": "^4.9.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    "lint": "eslint src --ext .js,.jsx,.ts,.tsx",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,scss}\"",
    "cypress:open": "cypress open",
    "cypress:run": "cypress run"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
EOF

# Create frontend tsconfig.json
cat > frontend/tsconfig.json << EOF
{
  "compilerOptions": {
    "target": "es5",
    "lib": [
      "dom",
      "dom.iterable",
      "esnext"
    ],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": "src",
    "paths": {
      "@/*": ["*"]
    }
  },
  "include": [
    "src"
  ]
}
EOF

# Create frontend .env.example
cat > frontend/.env.example << EOF
REACT_APP_API_URL=http://localhost:3000
REACT_APP_ENV=development
EOF

# Create database initialization script
echo -e "${BLUE}Creating database initialization script...${NC}"
cat > scripts/init-db.sh << EOF
#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "\$POSTGRES_USER" --dbname "\$POSTGRES_DB" <<-EOSQL
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  
  -- Create users table for auth
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(20) NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  
  -- Create pets table
  CREATE TABLE IF NOT EXISTS pets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    species VARCHAR(50) NOT NULL,
    breed VARCHAR(100),
    birth_date DATE,
    weight DECIMAL,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  
  -- Add test user
  INSERT INTO users (email, password, first_name, last_name, role)
  VALUES ('admin@doghouse.com', '\$2b\$10\$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', 'Admin', 'User', 'admin');
EOSQL

echo "Database initialized successfully!"
EOF
chmod +x scripts/init-db.sh

# Create GitHub Actions workflow for CI/CD
echo -e "${BLUE}Creating GitHub Actions workflow...${NC}"
mkdir -p .github/workflows
cat > .github/workflows/ci.yml << EOF
name: CI Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        
    # Backend services build and test
    - name: Install API Gateway dependencies
      working-directory: ./backend/api-gateway
      run: npm ci
      
    - name: Lint API Gateway
      working-directory: ./backend/api-gateway
      run: npm run lint
      
    - name: Test API Gateway
      working-directory: ./backend/api-gateway
      run: npm test
      
    - name: Build API Gateway
      working-directory: ./backend/api-gateway
      run: npm run build
      
    # Repeat for other services
    # ...
      
    # Frontend build and test
    - name: Install Frontend dependencies
      working-directory: ./frontend
      run: npm ci
      
    - name: Lint Frontend
      working-directory: ./frontend
      run: npm run lint
      
    - name: Test Frontend
      working-directory: ./frontend
      run: npm test -- --watchAll=false
      
    - name: Build Frontend
      working-directory: ./frontend
      run: npm run build
      
    # Docker build
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
      
    - name: Build API Gateway Docker image
      uses: docker/build-push-action@v3
      with:
        context: ./backend/api-gateway
        push: false
        tags: doghouse/api-gateway:latest
        cache-from: type=gha
        cache-to: type=gha,mode=max
EOF

# Create Docker .dockerignore file
echo -e "${BLUE}Creating .dockerignore file...${NC}"
cat > .dockerignore << EOF
**/node_modules
**/dist
**/build
**/.git
**/.github
**/.vscode
**/.idea
**/coverage
**/.env
**/.env.*
**/*.log
EOF

# Create README with setup instructions
echo -e "${BLUE}Creating README with setup instructions...${NC}"
cat > README.md << EOF
# DogHouse - Pet Business Management Platform

DogHouse is a comprehensive pet business management platform designed to help pet businesses manage appointments, customers, pets, services, and analytics.

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+
- Git

### Development Setup

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/yourusername/doghouse.git
   cd doghouse
   \`\`\`

2. Copy environment files:
   \`\`\`bash
   cp backend/api-gateway/.env.example backend/api-gateway/.env
   cp backend/auth-service/.env.example backend/auth-service/.env
   cp backend/user-service/.env.example backend/user-service/.env
   cp backend/pet-service/.env.example backend/pet-service/.env
   cp frontend/.env.example frontend/.env
   \`\`\`

3. Start the development environment:
   \`\`\`bash
   docker-compose up -d
   \`\`\`

4. Access the applications:
   - Frontend: http://localhost:8080
   - API Gateway: http://localhost:3000
   - Swagger API Documentation: http://localhost:3000/api/docs

### Using the ELK Stack for Logging

To start the ELK stack for centralized logging:

\`\`\`bash
docker-compose --profile logging up -d
\`\`\`

- Kibana will be available at http://localhost:5601

## Project Structure

\`\`\`
DogHouse/
├── backend/         # Backend API and server code
│   ├── api-gateway/     # API Gateway service
│   ├── auth-service/    # Authentication service
│   ├── user-service/    # User management service
│   └── pet-service/     # Pet management service
├── frontend/        # Frontend web application 
├── docs/            # Documentation
├── tests/           # Test scripts and test data
├── scripts/         # Utility scripts for development
└── deployment/      # Deployment configurations
\`\`\`

## Key Features

- Customer and Pet Profile Management
- Appointment Scheduling and Calendar
- Service Management
- Online Booking
- Payment Processing
- Reporting and Analytics
- User Authentication and Authorization
- Notifications (Email/SMS)

## Development Guidelines

See the [docs/](./docs/) directory for detailed development guidelines.

## Contributing

Please read our [Contributing Guide](./CONTRIBUTING.md) before submitting a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
EOF

# Create CONTRIBUTING.md
echo -e "${BLUE}Creating CONTRIBUTING.md...${NC}"
cat > CONTRIBUTING.md << EOF
# Contributing to DogHouse

Thank you for considering contributing to DogHouse! This document outlines the process for contributing to the project.

## Code of Conduct

Please be respectful and constructive in all interactions with the project team and community.

## How to Contribute

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/your-feature-name\`)
3. Commit your changes (\`git commit -am 'Add some feature'\`)
4. Push to the branch (\`git push origin feature/your-feature-name\`)
5. Create a new Pull Request

## Development Workflow

1. Always create a new branch for your work
2. Follow the coding standards and guidelines
3. Write tests for your code
4. Ensure all tests pass before submitting a PR
5. Update documentation as needed

## Pull Request Process

1. Update the README.md or relevant documentation with details of changes
2. Add a descriptive title and detailed description to your PR
3. Include screenshots for UI changes
4. Link any related issues using keywords like "Fixes #123"
5. The PR will be merged once it receives approval from the maintainers

## Coding Standards

- Follow the established code style in the project
- Write clear, commented, and clean code
- Include appropriate tests
- Keep PRs focused on a single change

## Commit Message Guidelines

Use clear and descriptive commit messages following this format:

\`\`\`
feat(component): add new feature X
fix(api): resolve issue with authentication
docs: update README with setup instructions
test: add tests for feature Y
\`\`\`

## Reporting Bugs

When reporting bugs, please include:

- A clear, descriptive title
- Steps to reproduce the bug
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Environment details (OS, browser, etc.)

## Suggesting Features

When suggesting features, please include:

- A clear, descriptive title
- Detailed description of the feature
- Why the feature would be useful
- Any potential implementation ideas
EOF

# Create a simple LICENSE file
echo -e "${BLUE}Creating LICENSE file...${NC}"
cat > LICENSE << EOF
MIT License

Copyright (c) 2023 DogHouse Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF

# Initial commit
echo -e "${BLUE}Creating initial commit...${NC}"
git add .
git commit -m "Initial project setup"

echo -e "${GREEN}DogHouse project initialized successfully!${NC}"
echo -e "${GREEN}Next steps:${NC}"
echo -e "1. Navigate to the project directory: ${BLUE}cd DogHouse${NC}"
echo -e "2. Set up environment variables: ${BLUE}cp backend/api-gateway/.env.example backend/api-gateway/.env${NC} (repeat for each service)"
echo -e "3. Start the development environment: ${BLUE}docker-compose up -d${NC}"
echo -e "4. Begin development on the first milestone!" 