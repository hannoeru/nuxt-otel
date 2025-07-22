import { registerOTel } from '@vercel/otel'
import { defineNitroPlugin } from 'nitropack/runtime'

export default defineNitroPlugin((_nitroApp) => {
  registerOTel()
})
