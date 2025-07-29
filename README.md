# NestJS-Blueprint

NestJS-Blueprint is a scalable starter template for building robust NestJS applications. It comes with batteries-included integrations for AWS, databases, observability, security, and more—empowering you to quickly launch production-grade APIs and real-time systems with best practices.

## Features

- **Modular Architecture**: Organize your code with clear separation of concerns using modules for users, authentication, examples, and more.
- **Database Integration**: 
  - Built-in MongoDB support via Mongoose, with async configuration and robust connection event logging.
- **Authentication & Security**:
  - JWT-based authentication guard.
  - API key guard for securing endpoints.
  - Centralized exception handling and validation.
  - CORS and Helmet for secure HTTP headers.
- **AWS Integration**:
  - AWS S3 integration with utilities for file upload, download, deletion, listing, and presigned URLs.
  - Flexible credential management (env or IAM role).
- **Observability & Logging**:
  - OpenTelemetry tracing and metrics (OTLP exporter ready).
  - Context-aware, structured logging with Winston.
  - PII masking for sensitive fields in logs.
  - Correlation IDs and user context propagation.
- **HTTP Connector**:
  - Centralized, configurable HTTP client for outbound API calls with logging and error handling.
- **API Response Standardization**:
  - Global response interceptor for consistent API responses.
  - Global exception filter for uniform error handling.
- **Configuration Management**:
  - Environment-based config files (default, development, production, test).
  - Centralized config loading with `@nestjs/config`.
- **Developer Experience**:
  - Ready-to-use example modules and DTOs.
  - Built-in validation and error messages.
  - Modular, extensible codebase for rapid feature development.

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- MongoDB (local or remote)
- AWS account (for S3 integration, optional)

### Installation

```bash
git clone https://github.com/your-org/nestjs-blueprint.git
cd nestjs-blueprint
npm install
```

### Configuration

Copy `.env.example` to `.env` and update values as needed:

```bash
cp .env.example .env
```

Set up your MongoDB URI, JWT secrets, AWS credentials, etc.

### Running the App

```bash
npm run start:dev
```

The app will start on the port configured in your `.env` or `src/config/default.ts`.

## Project Structure

- `src/app.module.ts` – Main application module, imports all features.
- `src/common/` – Shared utilities, guards, interceptors, filters, helpers.
- `src/modules/` – Feature modules (auth, user, example).
- `src/config/` – Environment-specific configuration.
- `src/tracer.ts` – OpenTelemetry tracing setup.

## Extending the Blueprint

- Add new modules under `src/modules/`.
- Register new providers or services in the relevant module.
- Use the provided logger and HTTP connector for consistency.

## Contributing

Contributions are welcome! Please open issues or pull requests.

## License

MIT
