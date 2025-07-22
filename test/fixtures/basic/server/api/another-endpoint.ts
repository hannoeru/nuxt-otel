export default defineEventHandler((e) => {
  const parentSpanId = e.context.otel.span.parentSpanContext?.spanId
  return {
    traceId: e.context.otel.span.spanContext().traceId,
    parentSpanId,
  }
})
