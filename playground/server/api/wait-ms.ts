import type { Span } from '@opentelemetry/sdk-trace-base'

export default defineEventHandler(async (e) => {
  const ms = Number(getQuery(e).ms)
  await new Promise(resolve => setTimeout(resolve, ms))
  const { traceId, parentSpanId } = await $fetch('/api/another-endpoint')
  const span = e.context.otel.span as Span
  return {
    name: span.name,
    traceId: span.spanContext().traceId,
    spanId: span.spanContext().spanId,
    anotherEndpoint: {
      traceId,
      parentSpanId,
    },
  }
})
