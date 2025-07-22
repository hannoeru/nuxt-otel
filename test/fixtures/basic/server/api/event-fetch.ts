export default defineEventHandler(async (e) => {
  const { traceId, parentSpanId } = await e.$fetch('/api/another-endpoint')
  return {
    traceId: e.context.otel.span.spanContext().traceId,
    spanId: e.context.otel.span.spanContext().spanId,
    anotherEndpoint: {
      traceId,
      parentSpanId,
    },
    parentSpanId: e.context.otel.span.parentSpanContext?.spanId,
  }
})
