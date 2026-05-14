import fs from 'node:fs/promises'
import path from 'node:path'
import type { AppState, DeviceEntity, PatientEntity, AlertEntity } from '~/types'

const DB_PATH = path.resolve(process.cwd(), 'server/data/db.json')

export async function getAppState(): Promise<AppState> {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8')
    const state = JSON.parse(data) as AppState
    if (!state.patients) state.patients = {}
    if (!state.alerts) state.alerts = []
    return state
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      const defaultState: AppState = { watches: {}, beacons: {}, gateways: {}, patients: {}, alerts: [] }
      await saveAppState(defaultState)
      return defaultState
    }
    throw err
  }
}

export async function saveAppState(state: AppState): Promise<void> {
  await fs.writeFile(DB_PATH, JSON.stringify(state, null, 2), 'utf-8')
}

export async function registerDevice(
  type: 'watch' | 'beacon' | 'gateway',
  id: string,
  timestamp: number
): Promise<void> {
  const state = await getAppState()

  const collection = type === 'watch' ? state.watches
                   : type === 'beacon' ? state.beacons
                   : state.gateways

  if (!collection[id]) {
    collection[id] = {
      id,
      type,
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)} (${id})`,
      lastSeen: timestamp,
      ...(type === 'beacon' ? { room: null } : {})
    }
    console.log(`[Auto-Discovery] Nouvel appareil détecté : ${type} ${id}`)
  } else {
    collection[id].lastSeen = timestamp
  }

  await saveAppState(state)
}

// ── Patients ──────────────────────────────────────────────────

export async function getPatients(): Promise<PatientEntity[]> {
  const state = await getAppState()
  return Object.values(state.patients)
}

export async function getPatient(id: string): Promise<PatientEntity | null> {
  const state = await getAppState()
  return state.patients[id] ?? null
}

export async function savePatient(patient: PatientEntity): Promise<void> {
  const state = await getAppState()
  state.patients[patient.id] = patient
  await saveAppState(state)
}

export async function patchPatient(
  id: string,
  updates: Partial<PatientEntity>
): Promise<PatientEntity | null> {
  const state = await getAppState()
  if (!state.patients[id]) return null
  state.patients[id] = { ...state.patients[id], ...updates }
  await saveAppState(state)
  return state.patients[id]
}

// ── Alerts ────────────────────────────────────────────────────

export async function getAlerts(): Promise<AlertEntity[]> {
  const state = await getAppState()
  return state.alerts
}

export async function addAlert(alert: AlertEntity): Promise<void> {
  const state = await getAppState()
  state.alerts.unshift(alert)
  if (state.alerts.length > 500) state.alerts = state.alerts.slice(0, 500)
  await saveAppState(state)
}

export async function patchAlert(
  id: string,
  updates: Partial<AlertEntity>
): Promise<AlertEntity | null> {
  const state = await getAppState()
  const idx = state.alerts.findIndex(a => a.id === id)
  if (idx === -1) return null
  state.alerts[idx] = { ...state.alerts[idx], ...updates }
  await saveAppState(state)
  return state.alerts[idx]
}
