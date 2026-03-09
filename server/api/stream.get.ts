import { sseBus, SSE_LOCATION_EVENT } from '~/server/utils/sse-bus'
import type { LocationEvent } from '~/types'

/**
 * GET /api/stream
 *
 * Endpoint SSE (Server-Sent Events).
 * Le frontend s'y connecte une fois et reçoit les mises à jour en temps réel.
 *
 * Usage côté client :
 *   const es = new EventSource('/api/stream')
 *   es.addEventListener('location:update', (e) => { ... })
 */
export default defineEventHandler(async (event) => {
  // ── Headers SSE ──────────────────────────────────────────────────────────
  setResponseHeader(event, 'Content-Type', 'text/event-stream')
  setResponseHeader(event, 'Cache-Control', 'no-cache, no-transform')
  setResponseHeader(event, 'Connection', 'keep-alive')
  setResponseHeader(event, 'X-Accel-Buffering', 'no') // Important pour Nginx / Coolify !

  event.node.res.flushHeaders()

  // ── Helper pour écrire un event SSE ─────────────────────────────────────
  const sendEvent = (eventName: string, data: unknown) => {
    const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`
    event.node.res.write(payload)
    // Force flush si compression activée
    if (typeof (event.node.res as any).flush === 'function') {
      ;(event.node.res as any).flush()
    }
  }

  // ── Envoyer un event "connected" pour confirmer la connexion ────────────
  sendEvent('connected', { message: 'SSE stream connected', ts: Date.now() })

  // ── Keepalive toutes les 25s (évite timeout proxy Coolify) ───────────────
  const keepAlive = setInterval(() => {
    event.node.res.write(': keepalive\n\n')
  }, 25_000)

  // ── Écouter les events de location ───────────────────────────────────────
  const onLocationUpdate = (locationEvent: LocationEvent) => {
    sendEvent(SSE_LOCATION_EVENT, locationEvent)
  }

  sseBus.on(SSE_LOCATION_EVENT, onLocationUpdate)

  // ── Cleanup quand le client se déconnecte ────────────────────────────────
  event.node.req.on('close', () => {
    sseBus.off(SSE_LOCATION_EVENT, onLocationUpdate)
    clearInterval(keepAlive)
    event.node.res.end()
  })

  // Garder la connexion ouverte indéfiniment
  await new Promise<void>(() => {})
})
