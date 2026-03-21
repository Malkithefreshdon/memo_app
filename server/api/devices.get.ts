import { getAppState } from '~/server/utils/storage'

export default defineEventHandler(async (event) => {
  const state = await getAppState()
  return {
    success: true,
    data: state
  }
})
