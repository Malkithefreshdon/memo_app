// Types partagés entre server et client

export interface RssiEntry {
  beacon_id: string
  rssi: number // négatif, ex: -55. Plus proche de 0 = plus fort = plus proche
}

export interface GatewayPayload {
  watch_id: string
  timestamp: number // Unix ms
  rssi_data: RssiEntry[]
  // estimated_room peut être envoyé par le gateway si il veut faire son propre calcul,
  // sinon l'API le calcule via les rssi_data
  estimated_room?: string
}

export interface LocationEvent {
  watch_id: string
  room: string
  timestamp: number
  confidence: number // 0-1, basé sur l'écart RSSI entre le meilleur et le second beacon
  rssi_data: RssiEntry[]
}

// Mapping beacon → pièce : à adapter à ton déploiement physique
export interface BeaconConfig {
  beacon_id: string
  room: string
  description?: string
}
