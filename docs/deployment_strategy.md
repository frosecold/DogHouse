# DogHouse Deployment Strategy

This document outlines the deployment strategy for the DogHouse application, with a focus on portability between development, staging, and production environments.

## Deployment Principles

1. **Environment Consistency**: Development, staging, and production environments should be as similar as possible, Docker containers are the prefered 
2. **Infrastructure as Code**: All infrastructure should be defined and versioned as code
3. **Containerization**: All application components should be containerized
4. **Configuration Management**: Environment-specific configuration should be externalized
5. **Automated Deployments**: Deployments should be automated and repeatable
6. **Portability**: Application should be easily movable between environments

## Technology Stack

The deployment strategy utilizes the following technologies:

1. **Docker**: For containerization of application components
2. **Docker Compose**: For local development environment
3. **Kubernetes**: For orchestration in staging and production environments
4. **Helm**: For packaging and deploying Kubernetes applications
5. **Terraform**: For infrastructure provisioning
6. **GitHub Actions**: For CI/CD pipeline automation

## Environment Setup

### Local Development Environment

Local development will use Docker Compose to create a development environment similar to production:

```yaml
# docker-compose.yml
version: '3.8'

services:
  api-gateway:
    build: 
      context: ./backend/api-gateway
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./backend/api-gateway:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgres://postgres:postgres@postgres:5432/doghouse
      - AUTH_SERVICE_URL=http://auth-service:3001
      - USER_SERVICE_URL=http://user-service:3002
      - PET_SERVICE_URL=http://pet-service:3003
    depends_on:
      - postgres
      - auth-service
      - user-service
      - pet-service

  auth-service:
    build:
      context: ./backend/auth-service
      dockerfile: Dockerfile.dev
    ports:
      - "3001:3001"
    volumes:
      - ./backend/auth-service:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgres://postgres:postgres@postgres:5432/doghouse
      - JWT_SECRET=dev_secret_key_replace_in_production
    depends_on:
      - postgres

  user-service:
    build:
      context: ./backend/user-service
      dockerfile: Dockerfile.dev
    ports:
      - "3002:3002"
    volumes:
      - ./backend/user-service:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgres://postgres:postgres@postgres:5432/doghouse
    depends_on:
      - postgres

  pet-service:
    build:
      context: ./backend/pet-service
      dockerfile: Dockerfile.dev
    ports:
      - "3003:3003"
    volumes:
      - ./backend/pet-service:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgres://postgres:postgres@postgres:5432/doghouse
    depends_on:
      - postgres

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "8080:8080"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - REACT_APP_API_URL=http://localhost:3000

  postgres:
    image: postgres:14-alpine
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=doghouse

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Production/Staging Environment (Kubernetes)

Production and staging environments will use Kubernetes for container orchestration:

```yaml
# kubernetes/api-gateway-deployment.yaml (example for one service)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: ${NAMESPACE}
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: ${DOCKER_REGISTRY}/doghouse/api-gateway:${IMAGE_TAG}
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: ${ENVIRONMENT}
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: doghouse-db-credentials
              key: url
        - name: AUTH_SERVICE_URL
          value: http://auth-service:3001
        - name: USER_SERVICE_URL
          value: http://user-service:3002
        - name: PET_SERVICE_URL
          value: http://pet-service:3003
        resources:
          limits:
            cpu: "0.5"
            memory: "512Mi"
          requests:
            cpu: "0.2"
            memory: "256Mi"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

## Configuration Management

Configuration will be managed differently in each environment:

### 1. Development Environment

- Environment variables stored in `.env` files
- Default configurations in `docker-compose.yml`
- Docker volumes for code changes

### 2. Staging Environment

- Environment variables stored in Kubernetes secrets and config maps
- Deployed via Helm charts with staging values
- Configured for testing and QA

### 3. Production Environment

- Environment variables stored in Kubernetes secrets and config maps
- Deployed via Helm charts with production values
- Configured for high availability and performance

## Addressing Portability Challenges

### 1. Service Discovery

For service-to-service communication:

- Development: Use container names in Docker Compose
- Staging/Production: Use Kubernetes service discovery

Example of portable service URL configuration:

```typescript
// In service configuration
const serviceConfig = {
  userServiceUrl: process.env.USER_SERVICE_URL || 'http://user-service:3002',
  petServiceUrl: process.env.PET_SERVICE_URL || 'http://pet-service:3003',
};
```

### 2. Database Connections

Database connections should use environment variables:

```typescript
// Database configuration
const dbConfig = {
  url: process.env.DATABASE_URL,
  // Fallback for development
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'doghouse',
};
```

### 3. Secrets Management

- Development: Use `.env` files (not committed to VCS)
- Staging/Production: Use Kubernetes secrets

Example Kubernetes secret:

```yaml
# kubernetes/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: doghouse-db-credentials
  namespace: ${NAMESPACE}
type: Opaque
data:
  url: ${BASE64_DATABASE_URL}
  username: ${BASE64_DB_USERNAME}
  password: ${BASE64_DB_PASSWORD}
```

### 4. Resource Requirements

- Development: Minimal resource limits in Docker Compose
- Staging/Production: Appropriate resource limits and requests in Kubernetes

## Deployment Workflow

### 1. Local Development

```bash
# Start local development environment
docker-compose up -d

# Watch for code changes
cd backend/api-gateway && npm run start:dev

# Run database migrations
docker-compose exec api-gateway npm run migrations:run
```

### 2. Continuous Integration

Each commit triggers the CI pipeline:

1. Build and test
2. Lint code
3. Run security scan
4. Build Docker images
5. Push to container registry with appropriate tags

```yaml
# .github/workflows/ci.yml
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
        node-version: '16'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Lint code
      run: npm run lint
      
    - name: Run tests
      run: npm run test
      
    - name: Build application
      run: npm run build
      
    - name: Build Docker image
      run: |
        docker build -t ${{ github.repository }}:${{ github.sha }} .
        
    - name: Push to Container Registry
      if: github.event_name != 'pull_request'
      uses: docker/build-push-action@v2
      with:
        context: .
        push: true
        tags: ${{ github.repository }}:${{ github.sha }}
```

### 3. Continuous Deployment

For staging/production deployments:

1. Update Helm chart values
2. Deploy to Kubernetes cluster
3. Run database migrations
4. Monitor deployment health

```yaml
# .github/workflows/cd.yml
name: CD Pipeline

on:
  workflow_run:
    workflows: ["CI Pipeline"]
    branches: [main, develop]
    types:
      - completed

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set environment
      run: |
        if [[ ${{ github.ref }} == 'refs/heads/main' ]]; then
          echo "ENVIRONMENT=production" >> $GITHUB_ENV
          echo "NAMESPACE=doghouse-prod" >> $GITHUB_ENV
        else
          echo "ENVIRONMENT=staging" >> $GITHUB_ENV
          echo "NAMESPACE=doghouse-staging" >> $GITHUB_ENV
        fi
        
    - name: Configure Kubernetes
      uses: azure/k8s-set-context@v1
      with:
        kubeconfig: ${{ secrets.KUBE_CONFIG }}
        
    - name: Deploy to Kubernetes
      run: |
        # Replace variables in Kubernetes manifests
        envsubst < kubernetes/api-gateway-deployment.yaml | kubectl apply -f -
        
        # Or use Helm
        helm upgrade --install doghouse ./charts/doghouse \
          --namespace ${{ env.NAMESPACE }} \
          --set environment=${{ env.ENVIRONMENT }} \
          --set image.tag=${{ github.sha }}
        
    - name: Run database migrations
      run: |
        kubectl exec -n ${{ env.NAMESPACE }} deploy/api-gateway -- npm run migrations:run
        
    - name: Verify deployment
      run: |
        kubectl rollout status deployment/api-gateway -n ${{ env.NAMESPACE }} --timeout=300s
```

## Migrating Between Environments

### 1. From Development to Staging

1. Build and push Docker images with staging tags
2. Update Helm chart values for staging
3. Deploy to staging Kubernetes cluster
4. Run database migrations
5. Verify deployment

### 2. From Staging to Production

1. Promote Docker images from staging to production
2. Update Helm chart values for production
3. Deploy to production Kubernetes cluster
4. Run database migrations
5. Verify deployment
6. Monitor application health

## Infrastructure as Code

Infrastructure will be managed using Terraform:

```hcl
# terraform/main.tf
provider "kubernetes" {
  config_path = var.kubeconfig_path
}

provider "helm" {
  kubernetes {
    config_path = var.kubeconfig_path
  }
}

module "postgres" {
  source = "./modules/postgres"
  
  namespace     = var.namespace
  db_name       = var.db_name
  db_user       = var.db_user
  db_password   = var.db_password
  storage_class = var.storage_class
  storage_size  = var.db_storage_size
}

module "redis" {
  source = "./modules/redis"
  
  namespace     = var.namespace
  storage_class = var.storage_class
  storage_size  = var.redis_storage_size
}

module "doghouse" {
  source = "./modules/doghouse"
  
  namespace      = var.namespace
  environment    = var.environment
  image_tag      = var.image_tag
  replicas       = var.replicas
  db_host        = module.postgres.host
  db_port        = module.postgres.port
  db_name        = var.db_name
  db_user        = var.db_user
  db_password    = var.db_password
  redis_host     = module.redis.host
  redis_port     = module.redis.port
}
```

## Backup and Restore Strategy

To ensure data portability:

1. **Database Backups**:
   - Automated daily backups
   - Pre-deployment backups
   - Easy restore process

2. **Configuration Backups**:
   - Version controlled Kubernetes manifests
   - Helm chart values
   - Terraform state

3. **Disaster Recovery**:
   - Documented recovery procedures
   - Regular recovery testing
   - Multi-region deployment option

## Monitoring and Observability

For monitoring across environments:

1. **Logging**:
   - Centralized logging with the ELK stack
   - Structured JSON logs
   - Log aggregation across services

2. **Metrics**:
   - Prometheus for metrics collection
   - Grafana for visualization
   - Service and infrastructure metrics

3. **Tracing**:
   - Distributed tracing with Jaeger
   - Request correlation IDs
   - Service dependency mapping

## Security Considerations

Security measures for all environments:

1. **Network Security**:
   - Service mesh for secure service-to-service communication
   - Network policies for isolation
   - Ingress/egress controls

2. **Secret Management**:
   - Kubernetes secrets for sensitive data
   - Encryption at rest
   - Secrets rotation

3. **Access Control**:
   - RBAC for Kubernetes access
   - Principle of least privilege
   - Auditing and logging

## Scalability Strategy

For handling increased load:

1. **Horizontal Scaling**:
   - Kubernetes Horizontal Pod Autoscaling
   - Defined resource limits and requests
   - Load testing to determine scaling thresholds

2. **Database Scaling**:
   - Read replicas for read-heavy workloads
   - Connection pooling
   - Query optimization

3. **Caching**:
   - Redis for caching
   - CDN for static assets
   - Optimized API responses

## Challenges and Mitigations

| Challenge | Mitigation |
|-----------|------------|
| Different environments | Containerization with Docker |
| Configuration differences | Environment variables and config maps |
| Database migration | Versioned migrations with rollback capability |
| Network connectivity | Service discovery and DNS |
| Resource constraints | Appropriate sizing and autoscaling |
| Secrets management | Kubernetes secrets and sealed secrets |

## Conclusion

This deployment strategy ensures that the DogHouse application can be easily moved between development, staging, and production environments with minimal friction. By following the principles of containerization, infrastructure as code, and automated deployments, we can achieve a portable and maintainable application deployment process. 