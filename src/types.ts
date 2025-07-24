import type { NodeSDKConfiguration } from '@opentelemetry/sdk-node'
import type { Configuration as VercelConfig } from '@vercel/otel'
import type { Import } from 'unimport'

export type NodeSDKConfig = Partial<NodeSDKConfiguration>
export type VercelSDKConfig = VercelConfig

/**
 * Configuration options for the Nuxt OpenTelemetry module
 */
export interface ModuleOptions {
  /**
   * Enable or disable the OpenTelemetry module
   *
   * @default true
   */
  enabled?: boolean

  /**
   * Regular expression pattern for request paths to exclude from tracing
   * Use this to prevent tracing of health checks, static assets, or other endpoints
   *
   * @example '^/api/health'
   * @example '^/(health|status|metrics)'
   */
  ignorePath?: string

  /**
   * HTTP request headers to include in span attributes
   * Useful for tracking custom headers like API keys, user agents, or correlation IDs
   *
   * @default []
   * @example ['x-custom-header', 'user-agent', 'x-correlation-id']
   */
  requestHeaders?: string[]

  /**
   * HTTP response headers to include in span attributes
   * Useful for tracking response metadata like cache status or custom application headers
   *
   * @default []
   * @example ['cache-control', 'x-custom-response-header']
   */
  responseHeaders?: string[]

  /**
   * Tracing configuration options
   */
  trace?: {
    /**
     * Node.js specific tracing configuration
     * Controls which modules and packages are instrumented at the Node.js level
     */
    node?: {
      /**
       * List of module names to specifically include in Node.js instrumentation
       * These modules will be traced even if they would normally be excluded
       *
       * @example ['fs', 'http', 'custom-package']
       */
      include?: string[]

      /**
       * List of module names to exclude from Node.js instrumentation
       * These modules will not be traced even if they would normally be included
       *
       * @example ['lodash', 'moment']
       */
      exclude?: string[]
    }

    /**
     * Function-level tracing configuration
     * Automatically instruments imported functions for detailed tracing
     */
    functions?: {
      /**
       * Enable or disable automatic function tracing
       * When enabled, imported functions matching the criteria will be automatically wrapped with tracing
       *
       * @default true
       */
      enabled?: boolean

      /**
       * Include functions from specific modules or packages
       * All functions imported from these modules will be candidates for tracing
       *
       * @default ['h3','nitropack/runtime']
       * @example ['h3', 'nitropack/runtime', 'my-custom-package']
       */
      includeFrom?: string[]

      /**
       * Functions to include in automatic tracing
       * Can be strings (exact match), RegExp patterns, or custom filter functions
       *
       * @default Functions from modules listed in `includeFrom` and utils
       * @example [/^use/, 'specificFunction', (item) => item.name.startsWith('api')]
       */
      include?: (string | RegExp | ((item: Import) => boolean))[]

      /**
       * Functions to exclude from automatic tracing
       * Can be strings (exact match), RegExp patterns, or custom filter functions
       * Takes precedence over include rules
       *
       * @default [/^define[A-Z]/] - Excludes Vue composition functions like defineComponent
       * @example [/^internal/, 'skipThisFunction', (item) => item.name.includes('private')]
       */
      exclude?: (string | RegExp | ((item: Import) => boolean))[]
    }
  }
}
