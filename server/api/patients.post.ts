import { savePatient } from '~/server/utils/storage'
import type { PatientEntity } from '~/types'

export default defineEventHandler(async (event) => {
  const body = await readBody<PatientEntity>(event)

  if (!body?.id || !body?.nom || !body?.prenom) {
    throw createError({ statusCode: 400, statusMessage: 'Champs id, nom et prenom requis' })
  }

  await savePatient(body)
  return { success: true }
})
