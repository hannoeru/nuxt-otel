export default defineEventHandler(async (e) => {
  const ms = Number(getQuery(e).ms)

  await new Promise(resolve => setTimeout(resolve, ms))
  const { traceId, parentSpanId } = await globalThis.$fetch('/api/another-endpoint')
  return {
    traceId: e.context.otel.span.spanContext().traceId,
    spanId: e.context.otel.span.spanContext().spanId,
    anotherEndpoint: {
      traceId,
      parentSpanId,
    },
  }
})
