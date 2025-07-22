import type { Span } from '@opentelemetry/sdk-trace-base'

export default defineEventHandler((e) => {
  const span = e.context.otel.span as Span
  const parentSpanId = span.parentSpanContext?.spanId
  return {
    name: span.name,
    traceId: span.spanContext().traceId,
    parentSpanId,
  }
})
