// @ts-expect-error missing types
import assets from '#otel/public-assets'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { defineNitroPlugin, useRuntimeConfig } from 'nitropack/runtime'
import { getFilter, logger } from '../../../../utils'

function ignorePath(path: string) {
  return path.startsWith('/_nuxt')
    || path.startsWith('/_fonts')
    || path.startsWith('/__nuxt_vite_node__')
    || assets.has(path)
}

export default defineNitroPlugin((nitroApp) => {
  const config = useRuntimeConfig()
  const filter = getFilter(config.opentelemetry.pathBlocklist)
  const sdk = new NodeSDK({
    // contextManager: new AsyncLocalStorageContextManager(),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-http': {
          // Filter out static _nuxt requests
          ignoreIncomingRequestHook: (req) => {
            if (!req.url) {
              return false
            }
            return ignorePath(req.url) || filter(req.url)
          },
        },
        '@opentelemetry/instrumentation-undici': {
          // Filter out static _nuxt requests
          ignoreRequestHook({ path }) {
            return ignorePath(path) || filter(path)
          },
        },
      }),
    ],
  })
  logger.info('Initializing OpenTelemetry SDK with Node instrumentation')
  sdk.start()
  nitroApp.hooks.hook('close', async () => {
    logger.info('Shutting down OpenTelemetry SDK')
    await sdk.shutdown().catch((err) => {
      logger.error('Error shutting down OpenTelemetry SDK', err)
    })
  })
})
