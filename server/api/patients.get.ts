import { getPatients } from '~/server/utils/storage'

export default defineEventHandler(async () => {
  const patients = await getPatients()
  return { success: true, data: patients }
})
