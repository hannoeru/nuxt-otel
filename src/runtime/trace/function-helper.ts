import { context, SpanStatusCode, trace } from '@opentelemetry/api'
import { ATTR_CODE_FUNCTION_NAME } from '@opentelemetry/semantic-conventions'
import { ATTR_CODE_FUNCTION_TYPE, TRACER_NAME } from '../constants'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function __nuxtOtelWrap(name: string, fn: any) {
  const wrappred = function (this: any, ...args: any[]) {
    const tracer = trace.getTracer(TRACER_NAME)
    const span = tracer.startSpan(name, {
      attributes: {
        [ATTR_CODE_FUNCTION_NAME]: name,
      },
    })
    const ctx = trace.setSpan(context.active(), span)
    const result = context.with(ctx, fn, this, ...args)
    // handle promises
    try {
      if (result && typeof result.then === 'function') {
        span.setAttribute(ATTR_CODE_FUNCTION_TYPE, 'async')
        result
          .then((i: any) => i)
          .catch((error: any) => {
            span.recordException(error)
            span.setStatus({ code: SpanStatusCode.ERROR })
          })
          .finally(() => {
            span.setStatus({ code: SpanStatusCode.OK })
            span.end()
            return result
          })
        return result
      }
    }
    // eslint-disable-next-line no-empty
    catch {}
    span.setAttribute(ATTR_CODE_FUNCTION_TYPE, 'sync')
    span.setStatus({ code: SpanStatusCode.OK })
    span.end()
    return result
  }
  return wrappred
}
