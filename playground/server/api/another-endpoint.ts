export default defineEventHandler((e) => {
  const parentSpanId = e.context.otel.span.parentSpanContext?.spanId
  return {
    name: e.context.otel.span.name,
    traceId: e.context.otel.span.spanContext().traceId,
    parentSpanId,
  }
})
