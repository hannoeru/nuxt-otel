import type { NodeSDKConfiguration } from '@opentelemetry/sdk-node'
import type { Configuration as VercelConfig } from '@vercel/otel'
import type { Import } from 'unimport'

export type NodeSDKConfig = Partial<NodeSDKConfiguration>
export type VercelSDKConfig = VercelConfig

export interface ModuleOptions {
  enabled?: boolean
  pathBlocklist?: string
  requestHeaders?: string[]
  responseHeaders?: string[]
  trace?: {
    node?: {
      include?: string[]
      exclude?: string[]
    }
    functions?: {
      enabled?: boolean
      include?: (string | RegExp | ((item: Import) => boolean))[]
      /**
       * Include from specific modules
       *
       * @default ['h3','nitropack/runtime']
       */
      includeFrom?: string[]
      exclude?: (string | RegExp | ((item: Import) => boolean))[]
    }
  }
}
