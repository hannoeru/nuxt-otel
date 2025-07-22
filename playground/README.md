# Nuxt OpenTelemetry Playground

This playground demonstrates how to use OpenTelemetry with Nuxt.js using environment variables for configuration.

## Getting Started

1. Start Grafana Tempo and Grafana with Docker Compose:

```bash
docker compose up -d
```

2. Run the Nuxt.js application:

```bash
npm run dev
```

## Environment Variables

The OpenTelemetry configuration is controlled via standard environment variables in the `.env` file:

- `OTEL_SERVICE_NAME`: Sets the service name for the application
- `OTEL_RESOURCE_ATTRIBUTES`: Sets additional resource attributes for the application
- `OTEL_EXPORTER_OTLP_ENDPOINT`: Sets the OTLP exporter endpoint
- `OTEL_EXPORTER_OTLP_PROTOCOL`: Sets the OTLP exporter protocol
- `OTEL_TRACES_SAMPLER`: Sets the sampler for traces
- `OTEL_TRACES_EXPORTER`: Sets the exporter for traces
- `OTEL_METRICS_EXPORTER`: Sets the exporter for metrics
- `OTEL_LOGS_EXPORTER`: Sets the exporter for logs

## Accessing the UI

- Grafana UI: http://localhost:3010 (admin/admin)
- Grafana Tempo: http://localhost:3200

## Configuration

- Docker Compose configuration: `compose.yml`
  - Uses Grafana Tempo for distributed tracing storage
  - Uses Grafana for visualization and dashboards
  - Exposes OTLP gRPC (4317) and HTTP (4318) endpoints
  - Grafana UI available at port 3010, Tempo at port 3200
