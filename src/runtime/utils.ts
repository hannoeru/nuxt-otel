import { consola } from 'consola'

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
