import { EventEmitter } from 'node:events'
import type { LocationEvent } from '~/types'

/**
 * Bus d'événements partagé entre les routes serveur.
 * location.post.ts émet → stream.get.ts reçoit et push au client SSE.
 *
 * On utilise un singleton global pour que le bus survive les hot-reloads en dev.
 */
declare global {
  // eslint-disable-next-line no-var
  var __sseBus: EventEmitter | undefined
}

if (!global.__sseBus) {
  global.__sseBus = new EventEmitter()
  global.__sseBus.setMaxListeners(100) // Supporte jusqu'à 100 clients connectés simultanément
}

export const sseBus = global.__sseBus

export const SSE_LOCATION_EVENT = 'location:update'

export function emitLocationUpdate(event: LocationEvent) {
  sseBus.emit(SSE_LOCATION_EVENT, event)
}
