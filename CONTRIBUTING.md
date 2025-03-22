# Contributing to DogHouse

Thank you for your interest in contributing to DogHouse! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Coding Standards](#coding-standards)
4. [Commit Guidelines](#commit-guidelines)
5. [Pull Request Process](#pull-request-process)
6. [Testing](#testing)
7. [Documentation](#documentation)
8. [Issue Reporting](#issue-reporting)
9. [Security Vulnerabilities](#security-vulnerabilities)

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm (v8+)
- Docker and Docker Compose
- Git

### Setting Up the Development Environment

1. Fork the repository

2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR-USERNAME/DogHouse.git
   cd DogHouse
   ```

3. Add the original repository as upstream:
   ```bash
   git remote add upstream https://github.com/ORIGINAL-OWNER/DogHouse.git
   ```

4. Install dependencies:
   ```bash
   # Run the setup script
   ./scripts/init_project.sh
   ```

5. Start the development environment:
   ```bash
   docker-compose up -d
   ```

## Development Workflow

We follow a Git Flow inspired branching model:

1. `main` - Production-ready code
2. `develop` - Integration branch for features
3. Feature branches - For new features and non-urgent bug fixes
4. Hotfix branches - For urgent bug fixes

### Branch Naming Convention

- Feature branches: `feature/short-description`
- Bug fix branches: `bugfix/short-description` or `fix/short-description`
- Hotfix branches: `hotfix/short-description`
- Release branches: `release/vX.Y.Z`

### Development Process

1. Create a new branch from `develop` for your feature or bugfix
2. Make your changes
3. Write or update tests
4. Update documentation
5. Submit a pull request to the `develop` branch

## Coding Standards

### General Guidelines

- Follow the principle of SOLID, DRY, and KISS
- Write self-documenting code with clear variable and function names
- Keep functions small and focused on a single responsibility
- Comment complex logic and business rules
- Include JSDoc style comments for functions and classes

### TypeScript Style Guide

We follow the [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html) with some modifications:

- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons at the end of statements
- Use PascalCase for class/interface/type names
- Use camelCase for variable/function/method names
- Use UPPER_SNAKE_CASE for constants
- Limit line length to 100 characters
- Use type annotations for function parameters and return types

### Linting and Formatting

We use ESLint and Prettier to maintain code quality and consistency:

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

Our CI/CD pipeline will check your code against these standards.

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

### Example:

```
feat(auth): implement JWT authentication

Implement JWT authentication with refresh tokens and role-based access control.

Closes #123
```

## Pull Request Process

1. Update your branch with the latest changes from develop:
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout your-branch
   git rebase develop
   ```

2. Ensure your code passes all tests and linting
   ```bash
   npm run test
   npm run lint
   ```

3. Create a pull request against the `develop` branch
   - Fill in the PR template
   - Link to any related issues
   - Add appropriate labels

4. Request review from team members

5. Address review comments and update your PR

6. Once approved, a maintainer will merge your PR

## Testing

All code changes must include appropriate tests:

- **Unit Tests**: Test individual functions and classes
- **Integration Tests**: Test interactions between components
- **E2E Tests**: Test full user flows

### Running Tests

```bash
# Run all tests
npm run test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e

# Run tests with coverage
npm run test:coverage
```

### Test Guidelines

- Tests should be independent and isolated
- Avoid testing implementation details
- Focus on behavior rather than implementation
- Use descriptive test names that explain the expected behavior
- Follow the AAA pattern: Arrange, Act, Assert
- Aim for high test coverage, especially for critical paths

## Documentation

Good documentation is essential for the project's success:

- Update README.md and other documentation when adding or modifying features
- Document APIs using Swagger/OpenAPI
- Include JSDoc comments for functions and classes
- Document architecture decisions in Architecture Decision Records (ADRs)
- Create/update user guides for new features

## Issue Reporting

### Bug Reports

When reporting bugs, please include:

- A clear and descriptive title
- Steps to reproduce the bug
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Environment details (OS, browser, app version, etc.)

### Feature Requests

When suggesting features, please include:

- A clear and descriptive title
- Detailed description of the proposed feature
- Rationale for the feature
- Potential implementation details (optional)

## Security Vulnerabilities

If you discover a security vulnerability, please do NOT open an issue. Email security@doghouse.example.com instead. We will address security vulnerabilities as a priority.

---

Thank you for contributing to DogHouse! Your efforts help make this project better for everyone. 