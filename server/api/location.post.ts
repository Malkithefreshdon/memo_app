import { estimateRoom } from '~/server/utils/rssi'
import { registerDevice } from '~/server/utils/storage'
import { emitLocationUpdate } from '~/server/utils/sse-bus'
import type { GatewayPayload, LocationEvent } from '~/types'

/**
 * POST /api/location
 *
 * Endpoint appelé par le gateway RPi Zero 2W.
 * Reçoit les données RSSI brutes, estime la pièce, et diffuse via SSE.
 *
 * Exemple de payload attendue :
 * {
 *   "watch_id": "watch_001",
 *   "timestamp": 1712345678000,
 *   "rssi_data": [
 *     { "beacon_id": "beacon_1_1", "major": 1, "minor": 1, "rssi": -55 },
 *     { "beacon_id": "beacon_1_2", "major": 1, "minor": 2, "rssi": -82 },
 *     { "beacon_id": "beacon_1_3", "major": 1, "minor": 3, "rssi": -91 }
 *   ]
 * }
 */
export default defineEventHandler(async (event) => {
  // ── Authentification légère ──────────────────────────────────────────────
  const config = useRuntimeConfig()
  const authHeader = getRequestHeader(event, 'x-api-key')

  if (authHeader !== config.gatewayApiKey) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: invalid or missing x-api-key header',
    })
  }

  // ── Validation du body ───────────────────────────────────────────────────
  const body = await readBody<GatewayPayload>(event)

  if (!body?.watch_id || !Array.isArray(body?.rssi_data)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request: watch_id and rssi_data are required',
    })
  }

  if (body.rssi_data.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request: rssi_data must not be empty',
    })
  }

  // ── Auto-Discovery & Inscription State ─────────────────────────────────────
  const now = body.timestamp ?? Date.now()
  if (body.gateway_id) {
    await registerDevice('gateway', body.gateway_id, now)
  }
  await registerDevice('watch', body.watch_id, now)

  for (const b of body.rssi_data) {
    await registerDevice('beacon', b.beacon_id, now)
  }

  // ── Estimation de la pièce ───────────────────────────────────────────────
  // Si le gateway envoie déjà son estimation → on la respecte,
  // sinon on calcule via notre algo RSSI en utilisant la config DB
  let room: string
  let confidence: number

  if (body.estimated_room) {
    room = body.estimated_room
    confidence = 1.0 // Le gateway est certain (il a fait son propre algo)
  } else {
    // Calcul de l'estimation basé sur les beacons configurés via UI
    const result = await estimateRoom(body.rssi_data)
    room = result.room
    confidence = result.confidence
  }

  // ── Diffusion SSE ────────────────────────────────────────────────────────
  const locationEvent: LocationEvent = {
    watch_id: body.watch_id,
    room,
    confidence,
    timestamp: body.timestamp ?? Date.now(),
    rssi_data: body.rssi_data,
  }

  emitLocationUpdate(locationEvent)

  console.log(`[location] ${body.watch_id} → ${room} (confidence: ${confidence})`)

  return {
    success: true,
    estimated_room: room,
    confidence,
  }
})
