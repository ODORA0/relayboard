# 🏗️ Architecture Documentation

## System Overview

Relayboard follows a microservices architecture with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Frontend  │    │   API Gateway   │    │  Data Worker    │
│   (Next.js)     │◄──►│   (NestJS)      │◄──►│   (Python)      │
│   Port: 3000    │    │   Port: 4000    │    │   Port: 5055    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       ▼
         │              ┌─────────────────┐    ┌─────────────────┐
         │              │   PostgreSQL    │    │   MinIO/S3     │
         │              │   Port: 5433    │    │   Port: 9000    │
         │              └─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┘
                   │
         ┌─────────────────┐
         │     Redis       │
         │   Port: 6379    │
         └─────────────────┘
```

## Component Details

### 1. Web Frontend (Next.js)

**Purpose**: User interface for pipeline management

**Technology Stack**:

- Next.js 15 with App Router
- React 18 with TypeScript
- Tailwind CSS for styling
- Client-side state management

**Key Features**:

- Responsive design for all devices
- Real-time feedback and loading states
- Form validation and error handling
- Service status monitoring

**File Structure**:

```
apps/web/
├── app/
│   ├── globals.css          # Tailwind CSS styles
│   ├── layout.tsx           # Root layout component
│   └── page.tsx             # Main dashboard page
├── tailwind.config.js       # Tailwind configuration
├── postcss.config.js        # PostCSS configuration
└── package.json            # Dependencies and scripts
```

### 2. API Gateway (NestJS)

**Purpose**: Central API for all operations

**Technology Stack**:

- NestJS 10 with TypeScript
- PostgreSQL integration with pg
- MinIO client for object storage
- RESTful API design

**Key Features**:

- Dataset registration and management
- Destination configuration
- Pipeline orchestration
- Database connection pooling
- Error handling and validation

**API Endpoints**:

```typescript
// Health check
GET /health

// Dataset management
POST /v1/datasets/csv
Body: { name: string, csvUrl: string }

// Destination configuration
POST /v1/destinations/slack
Body: { webhookUrl: string }

// Pipeline execution
POST /v1/pipelines/run
Body: { datasetName: string }
```

**File Structure**:

```
apps/api/src/
├── main.ts              # Application entry point
├── module.ts            # NestJS module configuration
├── routes.ts            # API routes and controllers
├── db.ts                # Database connection
├── env.ts               # Environment configuration
├── s3.ts                # MinIO/S3 client
└── sql_init.ts          # Database schema initialization
```

### 3. Data Worker (Python/FastAPI)

**Purpose**: Heavy data processing and transformation

**Technology Stack**:

- FastAPI for HTTP API
- pandas for data manipulation
- psycopg for PostgreSQL connection
- boto3 for S3/MinIO operations
- subprocess for dbt execution
- requests for Slack integration

**Key Features**:

- CSV download and processing
- PostgreSQL data loading
- dbt model generation
- Slack webhook integration
- Error handling and logging

**Processing Pipeline**:

1. **Download**: Fetch CSV from MinIO
2. **Parse**: Use pandas to read CSV data
3. **Load**: Insert data into PostgreSQL staging schema
4. **Transform**: Generate and execute dbt models
5. **Deliver**: Send results to Slack webhook

**File Structure**:

```
apps/worker/
├── main.py              # FastAPI application
├── requirements.txt     # Python dependencies
└── start.sh            # Startup script
```

### 4. Database (PostgreSQL)

**Purpose**: Data storage and management

**Schema Design**:

- **`staging`**: Raw data from CSV files
- **`warehouse`**: Transformed data from dbt
- **Core tables**: `dataset`, `destination`, `run`

**Connection Details**:

- Host: localhost
- Port: 5433
- Database: relayboard
- User: relayboard
- Password: relayboard

### 5. Object Storage (MinIO)

**Purpose**: File storage for CSV datasets

**Features**:

- S3-compatible API
- Web console for management
- Bucket-based organization
- File versioning support

**Access Details**:

- Endpoint: http://localhost:9000
- Console: http://localhost:9001
- Access Key: relayboard
- Secret Key: relayboard123

### 6. Cache/Queue (Redis)

**Purpose**: Caching and job queuing (future use)

**Features**:

- In-memory data store
- Pub/sub messaging
- Job queue capabilities
- Session storage

## Data Flow Architecture

### 1. User Interaction Flow

```
User → Web UI → API → Database
  ↓
User ← Web UI ← API ← Worker ← Slack
```

### 2. Pipeline Execution Flow

```
CSV URL → API → MinIO
  ↓
API → Worker → MinIO (download)
  ↓
Worker → PostgreSQL (staging)
  ↓
Worker → dbt → PostgreSQL (warehouse)
  ↓
Worker → Slack (delivery)
```

### 3. Error Handling Flow

```
Error → Worker → API → Database (run.status = 'error')
  ↓
API → Web UI → User (error message)
```

## Security Considerations

### Current Implementation

- Environment-based configuration
- Database connection pooling
- Input validation and sanitization
- Error message sanitization

### Future Enhancements

- API authentication and authorization
- Rate limiting and throttling
- SSL/TLS encryption
- Audit logging
- Data encryption at rest

## Scalability Considerations

### Current Limitations

- Single-instance deployment
- In-memory processing
- Synchronous pipeline execution

### Future Improvements

- Horizontal scaling with load balancers
- Asynchronous job processing
- Distributed dbt execution
- Caching strategies
- Database read replicas

## Monitoring and Observability

### Current Monitoring

- Health check endpoints
- Service status indicators
- Error logging
- Pipeline run tracking

### Future Enhancements

- Application metrics (Prometheus)
- Distributed tracing (Jaeger)
- Log aggregation (ELK stack)
- Performance monitoring
- Alerting systems

## Development Workflow

### Local Development

1. Start infrastructure services (Docker)
2. Start API server (pnpm dev)
3. Start web interface (pnpm dev)
4. Start worker service (Python)

### Testing Strategy

- Unit tests for individual components
- Integration tests for API endpoints
- End-to-end tests for complete workflows
- Performance tests for scalability

### Deployment Pipeline

1. Code commit to repository
2. Automated testing
3. Build Docker images
4. Deploy to staging environment
5. Run integration tests
6. Deploy to production

## Technology Decisions

### Why Next.js?

- Server-side rendering capabilities
- Excellent developer experience
- Built-in optimization features
- Strong TypeScript support

### Why NestJS?

- Enterprise-grade framework
- Built-in dependency injection
- Decorator-based architecture
- Excellent TypeScript support

### Why Python/FastAPI?

- Excellent data processing libraries
- Fast API framework
- Easy integration with data tools
- Rich ecosystem for analytics

### Why PostgreSQL?

- ACID compliance
- JSON support
- Excellent performance
- Rich ecosystem

### Why MinIO?

- S3-compatible API
- Easy local development
- Production-ready features
- Cost-effective storage

## Future Architecture Evolution

### Phase 1: Microservices

- Service mesh implementation
- API gateway enhancement
- Distributed configuration

### Phase 2: Event-Driven

- Message queues (Kafka/RabbitMQ)
- Event sourcing
- CQRS pattern

### Phase 3: Cloud-Native

- Kubernetes deployment
- Service discovery
- Auto-scaling
- Multi-region deployment
