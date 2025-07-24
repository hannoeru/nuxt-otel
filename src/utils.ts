import type { Resolver } from '@nuxt/kit'
import { consola } from 'consola'
import { genImport } from 'knitwork'
import type { PresetName } from 'nitropack/presets'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import type { Nuxt } from 'nuxt/schema'

export const logger = consola.withTag('nuxt-otel')

export function getFilter(ignorePath?: string): (path: string) => boolean {
  if (!ignorePath) {
    return _path => false
  }
  try {
    const regex = new RegExp(ignorePath)
    return path => regex.test(path)
  }
  catch {
    return path => path.includes(ignorePath)
  }
}

export function getInstrumentedEntryFileForPreset(preset: PresetName, baseEntry: string, include?: string[], exclude?: string[]) {
  let entryFile
  if (preset === 'node-server') {
    entryFile = `import { register, createRequire } from 'node:module';
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
register(pathToFileURL(require.resolve("./node-hooks.mjs")), import.meta.url, { data: {
  include: ${JSON.stringify(include)},
  exclude: ${JSON.stringify(exclude)},
}})

// We should use dynamic imports after registering the customization hooks
// https://nodejs.org/api/module.html#customization-hooks

// Then load our application's entry point
import("${baseEntry}")
`
  }
  else if (preset.includes('vercel')) {
    entryFile = `
    ${genImport(baseEntry, 'handler')}
    export default handler
    `
  }
  return entryFile
}

export async function getPublicAssets(nuxt: Nuxt, resolver: Resolver) {
  const getAllFiles = (dir: string, baseDir = dir) => {
    const files: string[] = []
    if (!existsSync(dir)) {
      return files
    }
    const items = readdirSync(dir)
    for (const item of items) {
      const fullPath = join(dir, item)
      if (statSync(fullPath).isDirectory()) {
        files.push(...getAllFiles(fullPath, baseDir))
      }
      else {
        files.push(`/${relative(nuxt.options.dir.public, fullPath)}`)
      }
    }
    return files
  }
  return getAllFiles(await resolver.resolvePath(nuxt.options.dir.public))
}
