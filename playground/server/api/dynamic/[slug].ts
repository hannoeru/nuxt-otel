import type { Span } from '@opentelemetry/sdk-trace-base'

export default defineEventHandler((e) => {
  const span = e.context.otel.span as Span
  return {
    name: span.name,
    traceId: span.spanContext().traceId,
    spanId: span.spanContext().spanId,
  }
})
