import { createResolver } from '@nuxt/kit'
import type { Nitro } from 'nitropack/types'
import semver from 'semver'
import type { Import } from 'unimport'
import type { ModuleOptions } from './types'

export function setupFunctionTrace(nitro: Nitro, options: ModuleOptions) {
  const { resolve } = createResolver(import.meta.url)
  const helperPath = resolve('./runtime/trace/function-helper')

  const includeFrom = options.trace?.functions?.includeFrom || []

  const include = options.trace?.functions?.include || [
    i => includeFrom.includes(i.from),
    i => i.from.includes(`utils`),
  ]

  const exclude = options.trace?.functions?.exclude || [
    /^define[A-Z]/,
  ]

  function filter(item: Import) {
    if (item.type)
      return false
    const name = item.as || item.name
    if (!include.some(f => typeof f === 'function' ? f(item) : typeof f === 'string' ? name === f : f.test(name)))
      return false
    if (exclude.some(f => typeof f === 'function' ? f(item) : typeof f === 'string' ? name === f : f.test(name)))
      return false
    return true
  }

  if (!nitro.unimport) {
    throw new Error('[nuxt-otel] The trace function feature requires `unimport` to be created in your nitro configuration.')
  }

  const ctx = nitro.unimport.getInternalContext()

  if (!ctx.version || !semver.gte(ctx.version, '3.1.0'))
    throw new Error(`[nuxt-otel] The trace function feature requires \`unimport\` >= v3.1.0, but got \`${ctx.version || '(unknown)'}\`. Please upgrade using \`nuxi upgrade --force\`.`)

  ctx.addons.push(
    {
      injectImportsResolved(imports, _code, id) {
        if (id?.includes('?macro=true'))
          return
        return imports.map((i) => {
          if (!filter(i))
            return i

          const name = i.as || i.name

          return {
            ...i,
            meta: {
              wrapperOriginalAs: name,
            },
            as: `_$__${name}`,
          }
        })
      },
      injectImportsStringified(str, imports, s, id) {
        if (id?.includes('?macro=true'))
          return
        const code = s.toString()
        const injected = imports.filter(i => i.meta?.wrapperOriginalAs)
        if (injected.length) {
          const result = `${str}\n${[
            code.includes('__nuxtOtelWrap')
              ? ''
              : `import { __nuxtOtelWrap } from ${JSON.stringify(helperPath)}`,
            ...injected.map(i => `const ${i.meta!.wrapperOriginalAs} = __nuxtOtelWrap(${JSON.stringify(i.name)}, ${i.as})`),
          ].join(';\n')};\n`
          return result
        }
      },
    },
  )
}
