import type { RssiEntry, BeaconConfig } from '~/types'

/**
 * Configuration des balises BLE déployées dans l'appartement.
 * Mettre à jour beacon_id avec les vraies adresses MAC / IDs de tes balises.
 */
export const BEACONS: BeaconConfig[] = [
  { beacon_id: 'beacon_chambre1', room: 'chambre1', description: 'Balise Chambre 1' },
  { beacon_id: 'beacon_chambre2', room: 'chambre2', description: 'Balise Chambre 2' },
  { beacon_id: 'beacon_chambre3', room: 'chambre3', description: 'Balise Chambre 3' },
  { beacon_id: 'beacon_couloir', room: 'couloir', description: 'Balise Couloir' },
]

const BEACON_ROOM_MAP: Record<string, string> = Object.fromEntries(
  BEACONS.map(b => [b.beacon_id, b.room])
)

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
export function estimateRoom(rssiData: RssiEntry[]): { room: string; confidence: number } {
  const RSSI_IGNORE_THRESHOLD = -95 // dBm, en dessous on ignore complètement

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
  // Un grand écart = on est clairement dans cette pièce
  // Un faible écart = on est peut-être en bordure entre deux pièces
  let confidence = 1.0
  if (second) {
    const gap = Math.abs(best.rssi - second.rssi) // toujours positif
    // Gap de 15 dB ou plus → confidence 1.0, gap de 0 → confidence 0.2
    confidence = Math.min(1.0, Math.max(0.2, gap / 15))
  }

  return {
    room: BEACON_ROOM_MAP[best.beacon_id],
    confidence: Math.round(confidence * 100) / 100,
  }
}
