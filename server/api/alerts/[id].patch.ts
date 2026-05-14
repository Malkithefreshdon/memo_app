import { patchAlert } from '~/server/utils/storage'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)

  if (!body || Object.keys(body).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Body vide' })
  }

  const alert = await patchAlert(id, body)
  if (!alert) {
    throw createError({ statusCode: 404, statusMessage: `Alerte ${id} non trouvée` })
  }

  return { success: true, data: alert }
})
