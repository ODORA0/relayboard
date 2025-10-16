# 📚 Relayboard Documentation

Welcome to the Relayboard documentation! This comprehensive guide will help you understand, deploy, and extend the Relayboard data pipeline platform.

**Created by [AJAL ODORA JONATHAN](https://github.com/ODORA0)**

[![GitHub](https://img.shields.io/badge/GitHub-ODORA0-blue?style=flat-square&logo=github)](https://github.com/ODORA0)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)

## 📖 Documentation Index

### Getting Started

- **[README](../README.md)** - Project overview and quick start guide
- **[Architecture](ARCHITECTURE.md)** - System architecture and component details
- **[API Documentation](API.md)** - Complete API reference and examples

### Deployment & Operations

- **[Deployment Guide](DEPLOYMENT.md)** - Production deployment instructions
- **[Configuration](CONFIGURATION.md)** - Environment and service configuration
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions

### Development

- **[Development Setup](DEVELOPMENT.md)** - Local development environment
- **[Contributing](CONTRIBUTING.md)** - How to contribute to the project
- **[Testing](TESTING.md)** - Testing strategies and guidelines

### User Guides

- **[User Manual](USER_MANUAL.md)** - End-user guide for the web interface
- **[Pipeline Management](PIPELINE_MANAGEMENT.md)** - Creating and managing data pipelines
- **[Slack Integration](SLACK_INTEGRATION.md)** - Setting up Slack notifications

## 🚀 Quick Links

### For Users

- [Web Interface Guide](USER_MANUAL.md)
- [Creating Your First Pipeline](PIPELINE_MANAGEMENT.md)
- [Slack Setup](SLACK_INTEGRATION.md)

### For Developers

- [Architecture Overview](ARCHITECTURE.md)
- [API Reference](API.md)
- [Development Setup](DEVELOPMENT.md)

### For DevOps

- [Deployment Guide](DEPLOYMENT.md)
- [Configuration](CONFIGURATION.md)
- [Troubleshooting](TROUBLESHOOTING.md)

## 📋 What is Relayboard?

Relayboard is a modern data pipeline automation platform that transforms CSV/Google Sheets data into actionable insights delivered directly to your team's Slack channels.

### Key Features

- **Automated Data Processing**: CSV → PostgreSQL → dbt → Slack
- **Modern Web Interface**: Beautiful, responsive UI built with Next.js
- **RESTful API**: Complete API for integration and automation
- **Real-time Feedback**: Loading states, error handling, and success notifications
- **Scalable Architecture**: Microservices design with Docker support

### Use Cases

- **Business Intelligence**: Process sales data and send insights to teams
- **Operations Monitoring**: Transform system logs into actionable alerts
- **Analytics**: Convert raw data into formatted reports
- **Data Integration**: Bridge different data sources and destinations

## 🏗️ Architecture Overview

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
```

## 🚀 Quick Start

### 1. Start Infrastructure

```bash
docker compose -f infra/docker/docker-compose.dev.yml up -d
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Start Services

```bash
# Terminal 1 - API
pnpm --filter @relayboard/api dev

# Terminal 2 - Web
pnpm --filter @relayboard/web dev

# Terminal 3 - Worker
cd apps/worker && pip install -r requirements.txt && ./start.sh
```

### 4. Access Application

- **Web UI**: http://localhost:3000
- **API**: http://localhost:4000
- **Worker**: http://localhost:5055

## 📚 Documentation Structure

### Core Documentation

- **README.md**: Project overview and quick start
- **ARCHITECTURE.md**: Detailed system architecture
- **API.md**: Complete API reference
- **DEPLOYMENT.md**: Production deployment guide

### Additional Guides (Coming Soon)

- **CONFIGURATION.md**: Environment and service configuration
- **TROUBLESHOOTING.md**: Common issues and solutions
- **DEVELOPMENT.md**: Local development setup
- **CONTRIBUTING.md**: Contribution guidelines
- **TESTING.md**: Testing strategies
- **USER_MANUAL.md**: End-user guide
- **PIPELINE_MANAGEMENT.md**: Pipeline creation guide
- **SLACK_INTEGRATION.md**: Slack setup guide

## 🔧 Technology Stack

### Frontend

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework

### Backend

- **NestJS**: Enterprise-grade Node.js framework
- **PostgreSQL**: Relational database
- **MinIO**: S3-compatible object storage

### Data Processing

- **Python/FastAPI**: Data processing worker
- **pandas**: Data manipulation
- **dbt**: Data transformation
- **psycopg**: PostgreSQL adapter

### Infrastructure

- **Docker**: Containerization
- **Redis**: Caching and queuing
- **Slack**: Notification delivery

## 📈 Roadmap

### Phase 1: Core Features ✅

- [x] CSV data ingestion
- [x] PostgreSQL integration
- [x] dbt transformations
- [x] Slack delivery
- [x] Web interface

### Phase 2: Enhanced Features 🚧

- [ ] Google Sheets integration
- [ ] Advanced dbt models
- [ ] Data preview
- [ ] Pipeline scheduling
- [ ] Error handling improvements

### Phase 3: Enterprise Features 📋

- [ ] User management
- [ ] Audit logs
- [ ] Advanced analytics
- [ ] API security
- [ ] Multi-tenant support

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:

- Setting up a development environment
- Code style guidelines
- Submitting pull requests
- Reporting issues

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🙏 Support

- **Documentation**: This documentation site
- **Issues**: GitHub Issues for bug reports
- **Discussions**: GitHub Discussions for questions
- **Email**: Contact the maintainers

---

**Ready to transform your data into actionable insights? Start with Relayboard today!** 🚀

_Created with ❤️ by [AJAL ODORA JONATHAN](https://github.com/ODORA0)_
