# 🔌 API Documentation

## Base URL

```
Development: http://localhost:4000
Production: https://api.relayboard.com
```

## Authentication

Currently, the API does not require authentication. Future versions will implement JWT-based authentication.

## Response Format

All API responses follow this format:

```json
{
  "ok": boolean,
  "message"?: string,
  "error"?: string,
  "data"?: any
}
```

## Endpoints

### Health Check

#### `GET /health`

Check API service health.

**Response:**

```json
{
  "ok": true,
  "service": "api",
  "ts": "2024-01-15T10:30:00.000Z"
}
```

---

### Dataset Management

#### `POST /v1/datasets/csv`

Register a new CSV dataset for processing.

**Request Body:**

```json
{
  "name": "sales_data",
  "csvUrl": "https://example.com/data.csv"
}
```

**Parameters:**

- `name` (string, required): Unique name for the dataset
- `csvUrl` (string, required): URL to the CSV file

**Response:**

```json
{
  "ok": true,
  "s3Key": "uploads/1705312200000-abc123.csv"
}
```

**Error Responses:**

```json
{
  "ok": false,
  "error": "name and csvUrl required"
}
```

```json
{
  "ok": false,
  "error": "Failed to fetch CSV URL"
}
```

**Example Usage:**

```bash
curl -X POST http://localhost:4000/v1/datasets/csv \
  -H "Content-Type: application/json" \
  -d '{
    "name": "monthly_sales",
    "csvUrl": "https://example.com/sales-january.csv"
  }'
```

---

### Destination Configuration

#### `POST /v1/destinations/slack`

Configure Slack webhook for pipeline results.

**Request Body:**

```json
{
  "webhookUrl": "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
}
```

**Parameters:**

- `webhookUrl` (string, required): Slack incoming webhook URL

**Response:**

```json
{
  "ok": true
}
```

**Error Responses:**

```json
{
  "ok": false,
  "error": "No Slack webhook provided"
}
```

**Example Usage:**

```bash
curl -X POST http://localhost:4000/v1/destinations/slack \
  -H "Content-Type: application/json" \
  -d '{
    "webhookUrl": "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
  }'
```

---

### Pipeline Execution

#### `POST /v1/pipelines/run`

Execute a complete data pipeline for a registered dataset.

**Request Body:**

```json
{
  "datasetName": "sales_data"
}
```

**Parameters:**

- `datasetName` (string, required): Name of the registered dataset

**Response:**

```json
{
  "ok": true,
  "runId": 123,
  "worker": {
    "ok": true,
    "dbt_stdout": "dbt execution output...",
    "dbt_stderr": "dbt error output..."
  }
}
```

**Error Responses:**

```json
{
  "ok": false,
  "error": "dataset not found"
}
```

```json
{
  "ok": false,
  "error": "slack destination not configured"
}
```

**Example Usage:**

```bash
curl -X POST http://localhost:4000/v1/pipelines/run \
  -H "Content-Type: application/json" \
  -d '{
    "datasetName": "monthly_sales"
  }'
```

---

## Worker API Endpoints

The worker service runs on port 5055 and provides additional endpoints:

### `POST /preview`

Preview CSV data structure (placeholder).

**Request Body:**

```json
{
  "csvUrl": "https://example.com/data.csv"
}
```

**Response:**

```json
{
  "ok": true,
  "msg": "implement preview with DuckDB on bytes"
}
```

### `POST /run_full`

Execute complete pipeline (internal use).

**Request Body:**

```json
{
  "runId": 123,
  "datasetName": "sales_data",
  "s3": {
    "endpoint": "http://127.0.0.1:9000",
    "bucket": "relayboard",
    "key": "uploads/1705312200000-abc123.csv",
    "accessKey": "relayboard",
    "secretKey": "relayboard123"
  },
  "pg": {
    "host": "127.0.0.1",
    "port": 5433,
    "user": "relayboard",
    "password": "relayboard",
    "database": "relayboard"
  },
  "slack": {
    "webhookUrl": "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
  }
}
```

**Response:**

```json
{
  "ok": true,
  "dbt_stdout": "dbt execution output...",
  "dbt_stderr": "dbt error output..."
}
```

---

## Error Codes

| Code | Description                    |
| ---- | ------------------------------ |
| 200  | Success                        |
| 400  | Bad Request - Invalid input    |
| 404  | Not Found - Resource not found |
| 500  | Internal Server Error          |

## Rate Limiting

Currently, there are no rate limits implemented. Future versions will include:

- 100 requests per minute per IP
- 1000 requests per hour per API key

## Data Models

### Dataset

```typescript
interface Dataset {
  id: number;
  name: string;
  source_kind: "csv";
  s3_key: string;
  created_at: string;
}
```

### Destination

```typescript
interface Destination {
  id: number;
  kind: "slack";
  config_json: {
    webhookUrl: string;
  };
  created_at: string;
}
```

### Run

```typescript
interface Run {
  id: number;
  dataset_id: number;
  status: "queued" | "running" | "completed" | "failed";
  started_at: string;
  finished_at?: string;
  error?: string;
}
```

## Webhooks

### Slack Integration

When a pipeline completes successfully, the worker sends a formatted message to the configured Slack webhook:

**Message Format:**

```
*Relayboard Dispatch*
Table: `warehouse."sales_data_clean"`
Rows: 5
```

date=2024-01-15, product_name=Widget A, quantity=100, price=29.99
date=2024-01-15, product_name=Widget B, quantity=50, price=49.99
...

````

## SDK Examples

### JavaScript/TypeScript
```typescript
class RelayboardClient {
  constructor(private baseUrl: string) {}

  async registerDataset(name: string, csvUrl: string) {
    const response = await fetch(`${this.baseUrl}/v1/datasets/csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, csvUrl })
    });
    return response.json();
  }

  async configureSlack(webhookUrl: string) {
    const response = await fetch(`${this.baseUrl}/v1/destinations/slack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookUrl })
    });
    return response.json();
  }

  async runPipeline(datasetName: string) {
    const response = await fetch(`${this.baseUrl}/v1/pipelines/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ datasetName })
    });
    return response.json();
  }
}

// Usage
const client = new RelayboardClient('http://localhost:4000');
await client.registerDataset('sales', 'https://example.com/sales.csv');
await client.configureSlack('https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK');
await client.runPipeline('sales');
````

### Python

```python
import requests

class RelayboardClient:
    def __init__(self, base_url):
        self.base_url = base_url

    def register_dataset(self, name, csv_url):
        response = requests.post(
            f"{self.base_url}/v1/datasets/csv",
            json={"name": name, "csvUrl": csv_url}
        )
        return response.json()

    def configure_slack(self, webhook_url):
        response = requests.post(
            f"{self.base_url}/v1/destinations/slack",
            json={"webhookUrl": webhook_url}
        )
        return response.json()

    def run_pipeline(self, dataset_name):
        response = requests.post(
            f"{self.base_url}/v1/pipelines/run",
            json={"datasetName": dataset_name}
        )
        return response.json()

# Usage
client = RelayboardClient("http://localhost:4000")
client.register_dataset("sales", "https://example.com/sales.csv")
client.configure_slack("https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK")
client.run_pipeline("sales")
```

## Testing

### Postman Collection

Import the following collection for API testing:

```json
{
  "info": {
    "name": "Relayboard API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/health",
          "host": ["{{baseUrl}}"],
          "path": ["health"]
        }
      }
    },
    {
      "name": "Register Dataset",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"test_dataset\",\n  \"csvUrl\": \"https://example.com/test.csv\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/v1/datasets/csv",
          "host": ["{{baseUrl}}"],
          "path": ["v1", "datasets", "csv"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:4000"
    }
  ]
}
```

## Changelog

### v1.0.0

- Initial API release
- CSV dataset registration
- Slack destination configuration
- Pipeline execution
- Basic error handling

### Future Versions

- Authentication and authorization
- Rate limiting
- Webhook validation
- Advanced error handling
- API versioning
