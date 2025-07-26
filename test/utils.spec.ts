import { describe, expect, it } from 'vitest'
import { getInstrumentedEntryFileForPreset } from '../src/utils'

describe('getInstrumentedEntryFileForPreset', () => {
  it('generates node-server entry file', () => {
    const entry = getInstrumentedEntryFileForPreset('node-server', './server.js', ['**/*.js'], ['**/node_modules/**'])
    expect(entry).toContain('import { register, createRequire }')
    expect(entry).toContain('register(pathToFileURL(require.resolve("./node-hooks.mjs"))')
    expect(entry).toContain('import("./server.js")')
    expect(entry).toContain('"**/*.js"')
    expect(entry).toContain('"**/node_modules/**"')
  })

  it('generates vercel entry file', () => {
    const entry = getInstrumentedEntryFileForPreset('vercel', './handler.js')
    expect(entry).toContain('import handler from "./handler.js"')
    expect(entry).toContain('export default handler')
  })

  it('generates vercel-edge entry file', () => {
    const entry = getInstrumentedEntryFileForPreset('vercel-edge', './handler.js')
    expect(entry).toContain('import handler from "./handler.js"')
    expect(entry).toContain('export default handler')
  })

  it('returns undefined for unsupported presets', () => {
    const entry = getInstrumentedEntryFileForPreset('static', './handler.js')
    expect(entry).toBeUndefined()
  })
})
