import type { RssiEntry } from '~/types'
import { getAppState } from '~/server/utils/storage'

/**
 * Estime la pièce à partir des données RSSI brutes.
 *
 * Algorithme : Weighted Nearest Beacon
 * - On ignore les beacons trop faibles (< seuil)
 * - On prend le beacon avec le meilleur RSSI → sa room
 * - La confidence est calculée sur l'écart entre le 1er et le 2e beacon
 *
 * @returns { room, confidence }
 */
export async function estimateRoom(rssiData: RssiEntry[]): Promise<{ room: string; confidence: number }> {
  const RSSI_IGNORE_THRESHOLD = -95 // dBm, en dessous on ignore complètement

  // Récupérer l'état dynamique depuis db.json
  const state = await getAppState()

  // Créer une map des beacons configurés avec une room assignée
  const BEACON_ROOM_MAP: Record<string, string> = {}
  Object.values(state.beacons).forEach((b: any) => {
    if (b.room) {
      BEACON_ROOM_MAP[b.id] = b.room
    }
  })

  // Filtrer les signaux trop faibles et mapper vers les rooms connues
  const valid = rssiData
    .filter(e => e.rssi > RSSI_IGNORE_THRESHOLD && BEACON_ROOM_MAP[e.beacon_id])
    .sort((a, b) => b.rssi - a.rssi) // du plus fort au plus faible

  if (valid.length === 0) {
    return { room: 'unknown', confidence: 0 }
  }

  const best = valid[0]
  const second = valid[1]

  // Confidence : écart entre le 1er et le 2e (en dB)
  let confidence = 1.0
  if (second) {
    const gap = Math.abs(best.rssi - second.rssi) // toujours positif
    confidence = Math.min(1.0, Math.max(0.2, gap / 15))
  }

  return {
    room: BEACON_ROOM_MAP[best.beacon_id],
    confidence: Math.round(confidence * 100) / 100,
  }
}
