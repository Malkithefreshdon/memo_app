// Types partagés entre server et client

export interface DeviceEntity {
  id: string
  type: 'watch' | 'beacon' | 'gateway'
  name: string // Nom configuré par l'utilisateur
  room?: string | null // Pour les balises: la pièce à laquelle elle est assignée
  lastSeen: number // Timestamp Unix ms
}

export interface AppState {
  watches: Record<string, DeviceEntity>
  beacons: Record<string, DeviceEntity>
  gateways: Record<string, DeviceEntity>
}

export interface RssiEntry {
  beacon_id: string
  major?: number
  minor?: number
  rssi: number // négatif, ex: -55. Plus proche de 0 = plus fort = plus proche
}

export interface GatewayPayload {
  gateway_id: string
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
