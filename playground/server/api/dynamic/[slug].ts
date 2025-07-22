export default defineEventHandler((e) => {
  return {
    name: e.context.otel.span.name,
    traceId: e.context.otel.span.spanContext().traceId,
    spanId: e.context.otel.span.spanContext().spanId,
  }
})
