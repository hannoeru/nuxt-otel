export default defineEventHandler(async (e) => {
  const { traceId, parentSpanId } = await $fetch('/api/another-endpoint')
  return {
    name: e.context.otel.span.name,
    traceId: e.context.otel.span.spanContext().traceId,
    spanId: e.context.otel.span.spanContext().spanId,
    anotherEndpoint: {
      traceId,
      parentSpanId,
    },
    parentSpanId: e.context.otel.span.parentSpanContext?.spanId,
  }
})
