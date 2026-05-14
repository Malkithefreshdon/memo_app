import { patchPatient } from '~/server/utils/storage'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)

  if (!body || Object.keys(body).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Body vide' })
  }

  const patient = await patchPatient(id, body)
  if (!patient) {
    throw createError({ statusCode: 404, statusMessage: `Patient ${id} non trouvé` })
  }

  return { success: true, data: patient }
})
