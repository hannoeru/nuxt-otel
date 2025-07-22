# Nuxt OpenTelemetry

<!-- [![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href] -->

OpenTelemetry integration for Nuxt 3 applications with automatic instrumentation and telemetry collection.

## Features

- 🔍 &nbsp;**Automatic instrumentation** - HTTP requests, API routes, and server-side operations
- 📊 &nbsp;**Multiple presets** - Support for Node.js and Vercel deployments
- ⚙️ &nbsp;**Flexible configuration** - Customize telemetry collection and filtering
- 🎯 &nbsp;**Zero-config setup** - Works out of the box with sensible defaults
- 🔧 &nbsp;**TypeScript support** - Full type safety for configuration options
- 🌐 &nbsp;**OpenTelemetry standards** - Compatible with all OpenTelemetry collectors
- 🎭 &nbsp;**Function tracing** - Automatic tracing of built-in functions

## Quick Setup

Install the module to your Nuxt application:

```bash
npx nuxi module add @hannoeru/nuxt-otel
```

That's it! OpenTelemetry instrumentation is now enabled in your Nuxt app ✨

## Configuration

Add the module to your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: [
    '@hannoeru/nuxt-otel'
  ],
  otel: {
    // Configuration options
  }
})
```

### Options

See the full type definitions in [`src/types.ts`](./src/types.ts).

### Basic Configuration

```ts
export default defineNuxtConfig({
  modules: ['@hannoeru/nuxt-otel'],
})
```

### Advanced Configuration

```ts
export default defineNuxtConfig({
  modules: ['@hannoeru/nuxt-otel'],
  otel: {
    pathBlocklist: '^/api/health',
    requestHeaders: ['x-custom-header', 'content'],
    responseHeaders: ['x-custom-header', 'content'],
    trace: {
      functions: {
        enabled: true,
        includeFrom: ['package'],
        include: [/useCustomTracing/],
        exclude: [/internal/]
      }
    }
  }
})
```

## Environment Setup

### Environment Variables

Configure OpenTelemetry using standard environment variables:

```bash
# Service identification
OTEL_SERVICE_NAME=my-nuxt-app

# Trace configuration
OTEL_TRACES_EXPORTER=otlp
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf

# Metrics configuration
OTEL_METRICS_EXPORTER=otlp
OTEL_EXPORTER_OTLP_METRICS_ENDPOINT=http://localhost:4318/v1/metrics

# Logs configuration
OTEL_LOGS_EXPORTER=otlp
OTEL_EXPORTER_OTLP_LOGS_ENDPOINT=http://localhost:4318/v1/logs

# Headers (if authentication is required)
OTEL_EXPORTER_OTLP_HEADERS=authorization=Bearer token123

# Resource attributes
OTEL_RESOURCE_ATTRIBUTES=service.name=my-nuxt-app,service.version=1.0.0,deployment.environment=production
```

### Local Development with Docker

See the example Docker Compose setup in [`playground/compose.yml`](./playground/compose.yml).

Start the services:

```bash
docker-compose -f playground/compose.yml up -d
```

### Production Deployment

#### Supported platforms

- **Node.js**: Use the default configuration for Node.js applications.
- **Vercel**: Use the Vercel preset for automatic instrumentation.

## API Routes Instrumentation

The module automatically instruments your API routes:

```ts
// server/api/users.get.ts
export default defineEventHandler(async (event) => {
  // This request will be automatically traced
  const users = await $fetch('/api/external-service')
  return users
})
```

## Custom Instrumentation

Add custom spans to your application:

```ts
// server/utils/trace.ts
import { trace } from '@opentelemetry/api'

export function useTracing() {
  const tracer = trace.getTracer('my-app')
  
  return {
    async withSpan<T>(name: string, fn: () => Promise<T>): Promise<T> {
      const span = tracer.startSpan(name)
      try {
        const result = await fn()
        span.setStatus({ code: 1 }) // OK
        return result
      } catch (error) {
        span.recordException(error)
        span.setStatus({ code: 2 }) // ERROR
        throw error
      } finally {
        span.end()
      }
    }
  }
}
```

### Debug Mode

Enable debug logging for OpenTelemetry:

```bash
OTEL_LOG_LEVEL=debug
```

## Resources

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [OpenTelemetry JavaScript SDK](https://github.com/open-telemetry/opentelemetry-js)

## License

[MIT](./LICENSE)
