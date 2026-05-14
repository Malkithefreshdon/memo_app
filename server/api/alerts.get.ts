import { getAlerts } from '~/server/utils/storage'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  let alerts = await getAlerts()

  if (query.patientId) {
    alerts = alerts.filter(a => a.patientId === query.patientId)
  }

  return { success: true, data: alerts }
})
