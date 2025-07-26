import { context, SpanStatusCode, trace } from '@opentelemetry/api'
import {
  ATTR_CLIENT_ADDRESS,
  ATTR_CLIENT_PORT,
  ATTR_ERROR_TYPE,
  ATTR_HTTP_REQUEST_METHOD,
  ATTR_HTTP_RESPONSE_STATUS_CODE,
  ATTR_NETWORK_PEER_ADDRESS,
  ATTR_NETWORK_PEER_PORT,
  ATTR_NETWORK_PROTOCOL_NAME,
  ATTR_NETWORK_PROTOCOL_VERSION,
  ATTR_SERVER_ADDRESS,
  ATTR_SERVER_PORT,
  ATTR_URL_PATH,
  ATTR_URL_QUERY,
  ATTR_URL_SCHEME,
  ATTR_USER_AGENT_ORIGINAL,
} from '@opentelemetry/semantic-conventions'
import {
  getRequestHeader,
  getRequestIP,
  getRequestURL,
  getResponseStatus,
  isError,
} from 'h3'

import { defineNitroPlugin, useRuntimeConfig } from 'nitropack/runtime'
import { TRACER_NAME } from '../../constants'
import { getFilter, logger } from '../../utils'
import { getRequestHeaderAttributes, getResponseHeaderAttributes, getRouteName, updateRouteAttributes } from '../utils'

export default defineNitroPlugin((nitroApp) => {
  const config = useRuntimeConfig().opentelemetry
  const filter = getFilter(config.ignorePath)
  const index = nitroApp.h3App.stack.findIndex(
    layer => layer.handler.__resolve__,
  )
  const router = nitroApp.h3App.stack[index]
  if (!router) {
    logger.warn('Unable to find router handler')
    return
  }
  nitroApp.hooks.hook('beforeResponse', (event) => {
    if (!event.context.otel?.span) {
      return
    }
    const span = event.context.otel.span
    updateRouteAttributes(event, span, nitroApp)
  })
  nitroApp.hooks.hook('afterResponse', (event) => {
    if (!event.context.otel?.span) {
      return
    }
    const span = event.context.otel.span
    const status = getResponseStatus(event)
    if (status >= 500 && status <= 599) {
      span.setAttribute(ATTR_ERROR_TYPE, 'Unknown Error')
      span.setStatus({ code: SpanStatusCode.ERROR })
    }
    else {
      span.setStatus({ code: SpanStatusCode.OK })
    }
    span.setAttribute(
      ATTR_HTTP_RESPONSE_STATUS_CODE,
      status,
    )
    span.setAttributes(
      getResponseHeaderAttributes(
        event,
        config.responseHeaders ?? [],
      ),
    )
    span.end(event.context.otel._endTime)
  })
  nitroApp.hooks.hook('error', (e, { event }) => {
    if (!event) {
      const span2 = trace.getActiveSpan()
      if (span2) {
        span2.recordException(e)
        span2.end()
      }
      return
    }
    if (!event.context.otel?.span) {
      return
    }
    const { span } = event.context.otel
    if (isError(e)) {
      if (e.statusCode >= 500 && e.statusCode <= 599) {
        span.setAttribute(ATTR_ERROR_TYPE, 'Unknown Error')
        span.setStatus({ code: SpanStatusCode.ERROR })
      }
      span.setAttribute(
        ATTR_HTTP_RESPONSE_STATUS_CODE,
        e.statusCode,
      )
      if (e.cause instanceof Error) {
        span.recordException(e.cause)
        span.setAttribute(ATTR_ERROR_TYPE, e.cause.name)
      }
    }
    else {
      if (e instanceof Error) {
        span.recordException(e)
        span.setAttribute(ATTR_ERROR_TYPE, e.name)
      }
      span.setStatus({ code: SpanStatusCode.ERROR })
      span.setAttribute(
        ATTR_HTTP_RESPONSE_STATUS_CODE,
        500,
      )
    }
    span.setAttributes(
      getResponseHeaderAttributes(
        event,
        config.responseHeaders ?? [],
      ),
    )
    updateRouteAttributes(event, span, nitroApp)
    span.end(event.context.otel._endTime)
  })
  const originalHandler = router.handler
  nitroApp.h3App.stack.splice(index, 1, {
    ...router,
    handler: async (event) => {
      if (filter(event.path)) {
        return await originalHandler(event)
      }
      const url = getRequestURL(event)
      const route = await getRouteName(event, nitroApp)
      const tracer = trace.getTracer(TRACER_NAME)
      const span = tracer.startSpan(
        `${event.method} ${route}`,
        {
          attributes: {
            // Required
            [ATTR_HTTP_REQUEST_METHOD]: event.method,
            [ATTR_URL_PATH]: url.pathname,
            [ATTR_URL_SCHEME]: url.protocol.replace(':', ''),
            [ATTR_NETWORK_PROTOCOL_NAME]: 'http',
            // Recommended
            [ATTR_CLIENT_ADDRESS]: getRequestIP(event, {
              xForwardedFor: true,
            }),
            [ATTR_CLIENT_PORT]: event.node.req.socket.remotePort,
            [ATTR_SERVER_ADDRESS]: url.hostname,
            [ATTR_SERVER_PORT]: url.port,
            [ATTR_NETWORK_PEER_ADDRESS]: getRequestIP(event, {
              xForwardedFor: true,
            }),
            [ATTR_NETWORK_PEER_PORT]: event.node.req.socket.remotePort,
            [ATTR_USER_AGENT_ORIGINAL]: getRequestHeader(
              event,
              'User-Agent',
            ),
            [ATTR_NETWORK_PROTOCOL_VERSION]: event.node.req.httpVersion,
            // Conditionally Required
            ...url.search ? { [ATTR_URL_QUERY]: url.search.substring(1) } : {},
            // Headers
            ...getRequestHeaderAttributes(
              event,
              config.requestHeaders ?? [],
            ),
          },
        },
      )
      const ctx = trace.setSpan(context.active(), span)
      event.context.otel = {
        span,
        ctx,
        _endTime: undefined,
      }
      return await context.with(ctx, async () => {
        const result = await originalHandler(event)
        if (event.context.otel) {
          event.context.otel._endTime = Date.now()
        }
        return result
      })
    },
  })
})
