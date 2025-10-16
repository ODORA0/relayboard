# 🚀 Deployment Guide

## Overview

This guide covers deploying Relayboard in different environments, from local development to production.

## Prerequisites

### Required Software

- **Docker & Docker Compose**: For containerized services
- **Node.js 18+**: For frontend and API
- **Python 3.11+**: For worker service
- **pnpm**: Package manager
- **dbt CLI**: For data transformations (optional in production)

### Required Accounts

- **Slack**: For webhook integration
- **Cloud Provider**: For production deployment (AWS, GCP, Azure)

## Local Development

### 1. Clone Repository

```bash
git clone <repository-url>
cd relayboard
```

### 2. Start Infrastructure

```bash
# Start PostgreSQL, MinIO, Redis
docker compose -f infra/docker/docker-compose.dev.yml up -d
```

### 3. Install Dependencies

```bash
# Install all workspace dependencies
pnpm install
```

### 4. Start Services

**Terminal 1 - API Server:**

```bash
pnpm --filter @relayboard/api dev
```

**Terminal 2 - Web Interface:**

```bash
pnpm --filter @relayboard/web dev
```

**Terminal 3 - Worker Service:**

```bash
cd apps/worker
pip install -r requirements.txt
./start.sh
```

### 5. Verify Deployment

- **Web UI**: http://localhost:3000
- **API**: http://localhost:4000/health
- **Worker**: http://localhost:5055/docs
- **MinIO Console**: http://localhost:9001

## Docker Deployment

### 1. Create Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: ${PG_PASSWORD}
      POSTGRES_USER: ${PG_USER}
      POSTGRES_DB: ${PG_DATABASE}
    ports:
      - "${PG_PORT}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${S3_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${S3_SECRET_KEY}
    ports:
      - "${S3_PORT}:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    ports:
      - "4000:4000"
    environment:
      - PG_HOST=postgres
      - PG_PORT=5432
      - PG_USER=${PG_USER}
      - PG_PASSWORD=${PG_PASSWORD}
      - PG_DATABASE=${PG_DATABASE}
      - S3_ENDPOINT=http://minio:9000
      - S3_ACCESS_KEY=${S3_ACCESS_KEY}
      - S3_SECRET_KEY=${S3_SECRET_KEY}
      - S3_BUCKET=${S3_BUCKET}
      - WORKER_BASE_URL=http://worker:5055
    depends_on:
      - postgres
      - minio
      - redis
    restart: unless-stopped

  worker:
    build:
      context: .
      dockerfile: apps/worker/Dockerfile
    ports:
      - "5055:5055"
    environment:
      - PG_HOST=postgres
      - PG_PORT=5432
      - PG_USER=${PG_USER}
      - PG_PASSWORD=${PG_PASSWORD}
      - PG_DATABASE=${PG_DATABASE}
      - S3_ENDPOINT=http://minio:9000
      - S3_ACCESS_KEY=${S3_ACCESS_KEY}
      - S3_SECRET_KEY=${S3_SECRET_KEY}
      - S3_BUCKET=${S3_BUCKET}
    depends_on:
      - postgres
      - minio
    restart: unless-stopped

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_BASE=http://localhost:4000
    depends_on:
      - api
    restart: unless-stopped

volumes:
  postgres_data:
  minio_data:
```

### 2. Create Dockerfiles

**API Dockerfile** (`apps/api/Dockerfile`):

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/api ./apps/api
COPY turbo.json ./

# Build application
RUN pnpm --filter @relayboard/api build

EXPOSE 4000

CMD ["pnpm", "--filter", "@relayboard/api", "start"]
```

**Worker Dockerfile** (`apps/worker/Dockerfile`):

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY apps/worker/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY apps/worker .

EXPOSE 5055

CMD ["python", "main.py"]
```

**Web Dockerfile** (`apps/web/Dockerfile`):

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/web ./apps/web
COPY turbo.json ./

# Build application
RUN pnpm --filter @relayboard/web build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

RUN npm install -g pnpm

COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["pnpm", "--filter", "@relayboard/web", "start"]
```

### 3. Environment Configuration

Create `.env.prod`:

```bash
# Database
PG_USER=relayboard
PG_PASSWORD=your_secure_password
PG_DATABASE=relayboard
PG_PORT=5432

# Storage
S3_ACCESS_KEY=relayboard
S3_SECRET_KEY=your_secure_secret_key
S3_BUCKET=relayboard
S3_PORT=9000

# Slack
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

### 4. Deploy

```bash
# Build and start all services
docker compose -f docker-compose.prod.yml up -d

# Check logs
docker compose -f docker-compose.prod.yml logs -f

# Scale services if needed
docker compose -f docker-compose.prod.yml up -d --scale worker=3
```

## Cloud Deployment

### AWS Deployment

#### 1. Infrastructure Setup

**ECS Task Definition** (`task-definition.json`):

```json
{
  "family": "relayboard",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "your-account.dkr.ecr.region.amazonaws.com/relayboard-api:latest",
      "portMappings": [
        {
          "containerPort": 4000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "PG_HOST",
          "value": "your-rds-endpoint"
        },
        {
          "name": "S3_ENDPOINT",
          "value": "https://your-bucket.s3.amazonaws.com"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/relayboard",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "api"
        }
      }
    }
  ]
}
```

#### 2. RDS Setup

```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier relayboard-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username relayboard \
  --master-user-password your-secure-password \
  --allocated-storage 20
```

#### 3. S3 Setup

```bash
# Create S3 bucket
aws s3 mb s3://relayboard-data

# Configure bucket policy
aws s3api put-bucket-policy --bucket relayboard-data --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::account:role/relayboard-role"
      },
      "Action": "s3:*",
      "Resource": "arn:aws:s3:::relayboard-data/*"
    }
  ]
}'
```

### Kubernetes Deployment

#### 1. Namespace and ConfigMap

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: relayboard

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: relayboard-config
  namespace: relayboard
data:
  PG_HOST: "postgres-service"
  PG_PORT: "5432"
  S3_ENDPOINT: "http://minio-service:9000"
```

#### 2. API Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: relayboard-api
  namespace: relayboard
spec:
  replicas: 3
  selector:
    matchLabels:
      app: relayboard-api
  template:
    metadata:
      labels:
        app: relayboard-api
    spec:
      containers:
        - name: api
          image: relayboard/api:latest
          ports:
            - containerPort: 4000
          envFrom:
            - configMapRef:
                name: relayboard-config
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: relayboard-api-service
  namespace: relayboard
spec:
  selector:
    app: relayboard-api
  ports:
    - port: 80
      targetPort: 4000
  type: LoadBalancer
```

## Production Considerations

### Security

#### 1. Environment Variables

```bash
# Use secrets management
export PG_PASSWORD=$(aws secretsmanager get-secret-value --secret-id relayboard/db-password --query SecretString --output text)
export SLACK_WEBHOOK=$(aws secretsmanager get-secret-value --secret-id relayboard/slack-webhook --query SecretString --output text)
```

#### 2. SSL/TLS

```nginx
# Nginx configuration
server {
    listen 443 ssl;
    server_name api.relayboard.com;

    ssl_certificate /etc/ssl/certs/relayboard.crt;
    ssl_certificate_key /etc/ssl/private/relayboard.key;

    location / {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 3. Authentication

```typescript
// JWT middleware for API
@UseGuards(JwtAuthGuard)
@Controller()
export class AppController {
  // Protected endpoints
}
```

### Monitoring

#### 1. Health Checks

```yaml
# Kubernetes health checks
livenessProbe:
  httpGet:
    path: /health
    port: 4000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health
    port: 4000
  initialDelaySeconds: 5
  periodSeconds: 5
```

#### 2. Logging

```typescript
// Structured logging
import { Logger } from "@nestjs/common";

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  @Post("/v1/datasets/csv")
  async registerCsv(@Body() body: CsvRegisterDto) {
    this.logger.log(`Registering dataset: ${body.name}`);
    // ... implementation
  }
}
```

#### 3. Metrics

```typescript
// Prometheus metrics
import { PrometheusModule } from "@willsoto/nestjs-prometheus";

@Module({
  imports: [PrometheusModule.register()],
})
export class AppModule {}
```

### Scaling

#### 1. Horizontal Scaling

```yaml
# Kubernetes HPA
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: relayboard-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: relayboard-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

#### 2. Database Scaling

```bash
# RDS read replicas
aws rds create-db-instance-read-replica \
  --db-instance-identifier relayboard-db-read-replica \
  --source-db-instance-identifier relayboard-db
```

## Backup and Recovery

### 1. Database Backup

```bash
# Automated RDS snapshots
aws rds create-db-snapshot \
  --db-instance-identifier relayboard-db \
  --db-snapshot-identifier relayboard-backup-$(date +%Y%m%d)
```

### 2. S3 Backup

```bash
# Cross-region replication
aws s3api put-bucket-replication \
  --bucket relayboard-data \
  --replication-configuration file://replication.json
```

### 3. Disaster Recovery

```bash
# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier relayboard-db-restored \
  --db-snapshot-identifier relayboard-backup-20240115
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues

```bash
# Check database connectivity
docker exec -it relayboard-postgres-1 psql -U relayboard -d relayboard -c "SELECT version();"
```

#### 2. Worker Service Issues

```bash
# Check worker logs
docker logs relayboard-worker-1

# Test worker endpoint
curl http://localhost:5055/docs
```

#### 3. MinIO Issues

```bash
# Check MinIO status
docker logs relayboard-minio-1

# Test MinIO connectivity
curl http://localhost:9000/minio/health/live
```

### Performance Optimization

#### 1. Database Optimization

```sql
-- Create indexes for better performance
CREATE INDEX idx_dataset_name ON dataset(name);
CREATE INDEX idx_run_status ON run(status);
CREATE INDEX idx_run_started_at ON run(started_at);
```

#### 2. Caching

```typescript
// Redis caching for API responses
@Injectable()
export class CacheService {
  constructor(@InjectRedis() private redis: Redis) {}

  async get(key: string) {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttl: number) {
    return this.redis.setex(key, ttl, value);
  }
}
```

## Maintenance

### 1. Regular Updates

```bash
# Update dependencies
pnpm update

# Rebuild Docker images
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

### 2. Database Maintenance

```sql
-- Regular maintenance tasks
VACUUM ANALYZE;
REINDEX DATABASE relayboard;
```

### 3. Log Rotation

```bash
# Configure log rotation
echo "/var/log/relayboard/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 root root
}" > /etc/logrotate.d/relayboard
```

This deployment guide provides comprehensive instructions for deploying Relayboard in various environments, from local development to production cloud deployments.
