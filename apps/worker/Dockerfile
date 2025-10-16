# RelayBoard Worker Dockerfile
# Python FastAPI worker with dbt support

FROM python:3.11-slim AS base
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY apps/worker/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy dbt project
COPY dbt/ ./dbt

# Copy worker application
COPY apps/worker/ ./

# Create dbt profiles directory
RUN mkdir -p /root/.dbt

# Set working directory
WORKDIR /app

# Expose port
EXPOSE 5055

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5055/health || exit 1

# Start the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5055"]
