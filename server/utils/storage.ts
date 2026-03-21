import fs from 'node:fs/promises'
import path from 'node:path'
import type { AppState, DeviceEntity } from '~/types'

const DB_PATH = path.resolve(process.cwd(), 'server/data/db.json')

export async function getAppState(): Promise<AppState> {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8')
    return JSON.parse(data) as AppState
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      const defaultState: AppState = { watches: {}, beacons: {}, gateways: {} }
      await saveAppState(defaultState)
      return defaultState
    }
    throw err
  }
}

export async function saveAppState(state: AppState): Promise<void> {
  await fs.writeFile(DB_PATH, JSON.stringify(state, null, 2), 'utf-8')
}

/**
 * Enregistre ou met à jour la date de dernière vue d'un device.
 * S'il n'existe pas, il est créé avec des valeurs par défaut.
 */
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
    // Nouvel appareil détecté !
    collection[id] = {
      id,
      type,
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)} (${id})`,
      lastSeen: timestamp,
      ...(type === 'beacon' ? { room: null } : {})
    }
    console.log(`[Auto-Discovery] Nouvel appareil détecté : ${type} ${id}`)
  } else {
    // Appareil connu, on met juste à jour le lastSeen
    collection[id].lastSeen = timestamp
  }

  await saveAppState(state)
}
