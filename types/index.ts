// Types partagés entre server et client

export interface DeviceEntity {
  id: string
  type: 'watch' | 'beacon' | 'gateway'
  name: string
  room?: string | null
  lastSeen: number
}

// ── Patients ─────────────────────────────────────────────────

export interface MedicationEntity {
  nom: string
  dosage: string
  horaire: string
  couleur: string
}

export interface ScheduleItemEntity {
  id: string
  titre: string
  heureDebut: string
  heureFin?: string
  couleur: string
  icone: string
}

export interface PatientEntity {
  id: string
  nom: string
  prenom: string
  chambre: string
  age: number
  unite: string
  dateNaissance: string
  contactUrgence: string
  allergies: string[]
  pathologies: string[]
  watchId: string | null
  authorizedZones: string[]
  humeur: string
  medications: MedicationEntity[]
  schedule: ScheduleItemEntity[]
}

export interface AlertEntity {
  id: string
  patientId: string
  patientNom: string
  type: 'fall' | 'heart_rate' | 'zone_exit'
  message: string
  lu: boolean
  createdAt: number // Unix ms
}

// ── AppState (db.json) ────────────────────────────────────────

export interface AppState {
  watches: Record<string, DeviceEntity>
  beacons: Record<string, DeviceEntity>
  gateways: Record<string, DeviceEntity>
  patients: Record<string, PatientEntity>
  alerts: AlertEntity[]
}

// ── Gateway / SSE ─────────────────────────────────────────────

export interface RssiEntry {
  beacon_id: string
  major?: number
  minor?: number
  rssi: number
}

export interface GatewayPayload {
  gateway_id: string
  watch_id: string
  timestamp: number
  rssi_data: RssiEntry[]
  estimated_room?: string
}

export interface LocationEvent {
  watch_id: string
  room: string
  timestamp: number
  confidence: number
  rssi_data: RssiEntry[]
}
