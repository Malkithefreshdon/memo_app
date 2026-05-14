// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  typescript: {
    strict: true,
  },

  nitro: {
    experimental: {
      websocket: true,
    },
  },

  runtimeConfig: {
    gatewayApiKey: process.env.GATEWAY_API_KEY || 'dev-secret-key',
  },
})
