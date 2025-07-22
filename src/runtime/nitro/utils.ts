import type { Attributes, Span } from '@opentelemetry/api'
import { context } from '@opentelemetry/api'
import { getRPCMetadata, RPCType } from '@opentelemetry/core'
import { ATTR_HTTP_REQUEST_HEADER, ATTR_HTTP_RESPONSE_HEADER, ATTR_HTTP_ROUTE } from '@opentelemetry/semantic-conventions'
import type { H3Event } from 'h3'
import { getRequestHeader, getResponseHeader } from 'h3'
import type { NitroApp } from 'nitropack/types'

export function getRequestHeaderAttributes(event: H3Event, headers: string[]) {
  return headers.reduce<Attributes>((attributes, header) => {
    const headerValue = getRequestHeader(event, header)
    if (headerValue) {
      attributes[ATTR_HTTP_REQUEST_HEADER(header.toLowerCase())] = [headerValue]
    }
    return attributes
  }, {})
}

export function getResponseHeaderAttributes(event: H3Event, headers: string[]) {
  return headers.reduce<Attributes>((attributes, header) => {
    const headerValue = getResponseHeader(event, header)
    if (headerValue) {
      attributes[ATTR_HTTP_RESPONSE_HEADER(header.toLowerCase())] = Array.isArray(headerValue) ? headerValue : [String(headerValue)]
    }
    return attributes
  }, {})
}

export async function updateRouteAttributes(event: H3Event, span: Span, nitroApp: NitroApp) {
  const route = await getRouteName(event, nitroApp)
  span.updateName(`${event.method} ${route}`)
  span.setAttribute(ATTR_HTTP_ROUTE, route)
  const rpcMetadata = getRPCMetadata(context.active())
  if (rpcMetadata?.type === RPCType.HTTP) {
    rpcMetadata.route = route ?? '/'
  }
}

export async function getRouteName(event: H3Event, nitroApp: NitroApp): Promise<string> {
  // const index = nitroApp.h3App.stack.findIndex(
  //   layer => layer.handler.__is_handler__,
  // )
  // const router = nitroApp.h3App.stack[index]
  // console.log(nitroApp.h3App.stack, router.handler.__resolve__?.(event.path))

  return (await nitroApp.h3App.resolve(event.path))?.route || event.path
}
