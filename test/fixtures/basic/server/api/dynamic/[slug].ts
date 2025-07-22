export default defineEventHandler((event) => {
  return event.context.otel.span.name
})
