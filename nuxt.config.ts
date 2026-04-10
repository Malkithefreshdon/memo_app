// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  typescript: {
    strict: true,
  },

  nitro: {
    preset: 'netlify',
  },

  runtimeConfig: {
    // Clé secrète pour authentifier les requêtes du gateway (optionnel mais recommandé)
    gatewayApiKey: process.env.GATEWAY_API_KEY || 'dev-secret-key',
  },
})
