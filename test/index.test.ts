/* eslint-disable @typescript-eslint/no-explicit-any */
import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const dummyTrace = '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01'
const dummyTrace2 = '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01'

await setup({
  rootDir: fileURLToPath(new URL('../playground', import.meta.url)),
  server: true,
  browser: false,
  setupTimeout: 120 * 1000,
})

describe('traces', async () => {
  it('should trace requests', async () => {
    const data = await $fetch<any>('/api')
    expect(data.traceId).toBeDefined()
  })

  it('should keep trace context', async () => {
    const data = await $fetch<any>('/api', {
      headers: {
        traceparent: dummyTrace,
      },
    })
    // assert that the traceId is the same
    expect(data.traceId).toBe(dummyTrace.split('-')[1])

    // assert that localFetch is correctly traced
    expect(data.anotherEndpoint.traceId).toBe(data.traceId)
    expect(data.anotherEndpoint.parentSpanId).toBe(data.spanId)
  })

  it('event.$fetch', async () => {
    const data = await $fetch<any>('/api/event-fetch', {
      headers: {
        traceparent: dummyTrace,
      },
    })
    // assert that the traceId is the same
    expect(data.traceId).toBe(dummyTrace.split('-')[1])

    // assert that localFetch is correctly traced
    expect(data.anotherEndpoint.traceId).toBe(data.traceId)
    expect(data.anotherEndpoint.parentSpanId).toBe(data.spanId)
  })

  it('expect no XRSP', async () => {
    const [data, data2] = await Promise.all([
      $fetch<any>('/api/wait-ms?ms=350', {
        headers: {
          traceparent: dummyTrace,
        },
      }),
      $fetch<any>('/api/wait-ms?ms=100', {
        headers: {
          traceparent: dummyTrace2,
        },
      }),
    ])

    // assert that the traceId is the same
    expect(data.traceId).toBe(dummyTrace.split('-')[1])

    // assert that localFetch is correctly traced
    expect(data.anotherEndpoint.traceId).toBe(data.traceId)
    expect(data.anotherEndpoint.parentSpanId).toBe(data.spanId)

    // assert that localFetch is correctly traced
    expect(data2.traceId).toBe(dummyTrace2.split('-')[1])
    expect(data2.anotherEndpoint.traceId).toBe(data2.traceId)
    expect(data2.anotherEndpoint.parentSpanId).toBe(data2.spanId)
  })

  it('should trace object handler', async () => {
    const data = await $fetch<any>('/api/event-object', {
      headers: {
        traceparent: dummyTrace,
      },
    })
    // assert that the traceId is the same
    expect(data.traceId).toBe(dummyTrace.split('-')[1])

    // assert that localFetch is correctly traced
    expect(data.anotherEndpoint.traceId).toBe(data.traceId)
    expect(data.anotherEndpoint.parentSpanId).toBe(data.spanId)
  })
})

describe('names', () => {
  it('should name span with method and path', async () => {
    const { name } = await $fetch<any>('/api/dynamic/test')
    expect(name).toBe('GET /api/dynamic/test')
  })
})
