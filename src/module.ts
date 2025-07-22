import type { Resolver } from '@nuxt/kit'
import { addServerTemplate, createResolver, defineNuxtModule, logger } from '@nuxt/kit'
import { defu } from 'defu'
import type { Nitro } from 'nitropack'
import type { PresetName } from 'nitropack/presets'
import { setupFunctionTrace } from './function'
import type { ModuleOptions } from './types'
import { getInstrumentedEntryFileForPreset, getPublicAssets } from './utils'

declare module '@nuxt/schema' {
  interface RuntimeConfig {
    opentelemetry: ModuleOptions
  }
}

const sdkPresetsMap: Record<string, PresetName[]> = {
  node: ['node', 'node-server', 'node-cluster', 'node-listener', 'nitro-dev'],
  vercel: ['vercel', 'vercel-edge'],
}

function nitroSetup(nitro: Nitro, config: ModuleOptions, resolver: Resolver) {
  nitro.options.externals.traceInclude ??= []
  nitro.options.externals.traceInclude.push(resolver.resolve('@opentelemetry/instrumentation'))

  let isInit = false
  Object.entries(sdkPresetsMap).forEach(([sdkName, presets]) => {
    if (presets.includes(nitro.options.preset)) {
      logger.info(`Setting up OpenTelemetry SDK for ${sdkName} preset`)
      nitro.options.plugins.push(resolver.resolve(`./runtime/nitro/plugins/presets/${sdkName}`))
      nitro.options.plugins.push(resolver.resolve('./runtime/nitro/plugins/instrumentation'))
      isInit = true
    }
  })
  if (!isInit) {
    logger.warn(
      `Using preset: ${nitro.options.preset}. Only node and vercel presets are officially supported.`,
    )
  }
}

const module = defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@hannoeru/nuxt-otel',
    configKey: 'otel',
    version: '0.0.1',
    compatibility: {
      bridge: false,
      nuxt: '>=3.10',
    },
  },
  defaults: {
    enabled: true,
    responseHeaders: [],
    requestHeaders: [],
    trace: {
      functions: {
        enabled: true,
        includeFrom: ['h3', 'nitropack/runtime'],
      },
    },
  },
  async setup(options, nuxt) {
    if (!options.enabled) {
      return
    }
    const resolver = createResolver(import.meta.url)
    nuxt.options.runtimeConfig.opentelemetry = defu(
      nuxt.options.runtimeConfig.opentelemetry,
      options,
    )
    const config = nuxt.options.runtimeConfig.opentelemetry

    addServerTemplate({
      filename: '#otel/public-assets',
      getContents: async () =>
        `export default new Set([${
          (await getPublicAssets(nuxt, resolver)).map(asset => `'${asset}'`).join(',')
        }])\n`,
    })

    nuxt.hooks.hook('nitro:init', async (nitro) => {
      nitroSetup(nitro, config, resolver)
      // Prepare the entry file for instrumentation
      const { entry, preset } = nitro.options
      if (preset === 'node-server') {
        nitro.hooks.hook('rollup:before', (_nitro, rollupConfig) => {
          if (typeof rollupConfig.input === 'string') {
            rollupConfig.input = [
              rollupConfig.input,
              resolver.resolve('./runtime/node-hooks'),
            ]
          }
          rollupConfig.output.entryFileNames = function (info) {
            if (info.name === 'node-hooks') {
              return 'node-hooks.mjs'
            }
            return 'index.mjs'
          }
        })
      }
      const newEntry = getInstrumentedEntryFileForPreset(
        preset,
        entry,
        options.trace?.node?.include,
        options.trace?.node?.exclude,
      )
      if (newEntry) {
        nitro.options.virtual['#virtual/instrumented-entry'] = newEntry
        nitro.options.entry = '#virtual/instrumented-entry'
      }

      if (config.trace?.functions?.enabled) {
        setupFunctionTrace(nitro, config)
      }

      // ignore THIS_IS_UNDEFINED warning for @opentelemetry/api
      nitro.hooks.hook('rollup:before', (_, rollupConfig) => {
        const originalOnWarn = rollupConfig.onwarn
        rollupConfig.onwarn = (warning, rollupWarn) => {
          // Ignore the this warning for @opentelemetry/api
          if (warning.code === 'THIS_IS_UNDEFINED' && warning.id?.includes('@opentelemetry/api')) {
            return
          }
          if (originalOnWarn) {
            originalOnWarn(warning, rollupWarn)
          }
          else {
            rollupWarn(warning)
          }
        }
      })
    })
  },
})

export * from './types'
export { module as default }
