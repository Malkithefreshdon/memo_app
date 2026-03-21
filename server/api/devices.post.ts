import { getAppState, saveAppState } from '~/server/utils/storage'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body || !body.type || !body.id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request: Missing type or id',
    })
  }

  const { type, id, name, room } = body
  const state = await getAppState()

  const collection = type === 'watch' ? state.watches
                   : type === 'beacon' ? state.beacons
                   : state.gateways

  if (!collection[id]) {
    throw createError({
      statusCode: 404,
      statusMessage: `Device ${id} of type ${type} not found`,
    })
  }

  if (name !== undefined) {
    collection[id].name = name
  }

  if (type === 'beacon' && room !== undefined) {
    collection[id].room = room
  }

  await saveAppState(state)

  return {
    success: true,
    device: collection[id]
  }
})
