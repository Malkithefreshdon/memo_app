import { addAlert } from '~/server/utils/storage'
import type { AlertEntity } from '~/types'

export default defineEventHandler(async (event) => {
  const body = await readBody<AlertEntity>(event)

  if (!body?.id || !body?.patientId || !body?.type) {
    throw createError({ statusCode: 400, statusMessage: 'Champs id, patientId et type requis' })
  }

  await addAlert(body)
  return { success: true }
})
