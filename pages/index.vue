<script setup lang="ts">
import type { LocationEvent } from '~/types'

// ── State ────────────────────────────────────────────────────────────────
const latestEvent = ref<LocationEvent | null>(null)
const isConnected = ref(false)
const lastSeen = ref<Date | null>(null)

// ── SSE Connection ────────────────────────────────────────────────────────
let eventSource: EventSource | null = null

function connect() {
  eventSource = new EventSource('/api/stream')

  eventSource.addEventListener('connected', () => {
    isConnected.value = true
    console.log('[SSE] Connected')
  })

  eventSource.addEventListener('location:update', (e: MessageEvent) => {
    const event: LocationEvent = JSON.parse(e.data)
    latestEvent.value = event
    lastSeen.value = new Date()
    console.log('[SSE] Location update:', event)
  })

  eventSource.onerror = () => {
    isConnected.value = false
    console.warn('[SSE] Connection lost, reconnecting in 3s...')
    // EventSource reconnecte automatiquement, mais on update l'UI
    setTimeout(() => {
      if (eventSource?.readyState === EventSource.CLOSED) {
        connect()
      }
    }, 3000)
  }
}

onMounted(() => connect())
onUnmounted(() => eventSource?.close())

// ── Computed ─────────────────────────────────────────────────────────────
const roomLabel = computed(() => {
  const map: Record<string, string> = {
    chambre1: 'Chambre 1',
    chambre2: 'Chambre 2',
    chambre3: 'Chambre 3',
    couloir: 'Couloir',
    unknown: 'Position inconnue',
  }
  return map[latestEvent.value?.room ?? ''] ?? '–'
})

const confidencePercent = computed(() =>
  latestEvent.value ? Math.round(latestEvent.value.confidence * 100) : 0
)

const timeSince = computed(() => {
  if (!lastSeen.value) return null
  const sec = Math.floor((Date.now() - lastSeen.value.getTime()) / 1000)
  if (sec < 60) return `il y a ${sec}s`
  return `il y a ${Math.floor(sec / 60)}min`
})

// Refresh timeSince toutes les secondes
const ticker = ref(0)
let tickInterval: ReturnType<typeof setInterval>
onMounted(() => { tickInterval = setInterval(() => ticker.value++, 1000) })
onUnmounted(() => clearInterval(tickInterval))
</script>

<template>
  <div class="app">
    <!-- Header -->
    <header class="header">
      <div class="header-inner">
        <h1 class="title">
          <span class="title-icon">⌚</span>
          Watch Tracker
        </h1>
        <div class="connection-badge" :class="{ connected: isConnected }">
          <span class="dot" />
          {{ isConnected ? 'Connecté' : 'Déconnecté' }}
        </div>
      </div>
    </header>

    <main class="main">
      <!-- Floor Plan -->
      <section class="plan-section">
        <FloorPlan
          :active-room="latestEvent?.room ?? null"
          :confidence="latestEvent?.confidence ?? 0"
        />
      </section>

      <!-- Status Panel -->
      <section class="status-panel">
        <div class="status-card">
          <div class="status-row">
            <span class="status-label">Montre</span>
            <span class="status-value mono">{{ latestEvent?.watch_id ?? '–' }}</span>
          </div>
          <div class="status-row">
            <span class="status-label">Pièce détectée</span>
            <span class="status-value highlight">{{ roomLabel }}</span>
          </div>
          <div class="status-row">
            <span class="status-label">Confiance</span>
            <div class="confidence-bar-wrapper">
              <div class="confidence-bar">
                <div
                  class="confidence-fill"
                  :style="{ width: `${confidencePercent}%` }"
                  :class="{
                    high: confidencePercent >= 75,
                    mid: confidencePercent >= 45 && confidencePercent < 75,
                    low: confidencePercent < 45,
                  }"
                />
              </div>
              <span class="confidence-label">{{ confidencePercent }}%</span>
            </div>
          </div>
          <div class="status-row">
            <span class="status-label">Dernière mise à jour</span>
            <span class="status-value mono">
              {{ ticker >= 0 && timeSince ? timeSince : '–' }}
            </span>
          </div>
        </div>

        <!-- RSSI Debug Panel -->
        <details class="rssi-debug" v-if="latestEvent?.rssi_data?.length">
          <summary>Détails RSSI</summary>
          <ul class="rssi-list">
            <li
              v-for="entry in [...latestEvent.rssi_data].sort((a, b) => b.rssi - a.rssi)"
              :key="entry.beacon_id"
              class="rssi-entry"
            >
              <span class="beacon-id mono">{{ entry.beacon_id }}</span>
              <span class="rssi-bar-mini">
                <span
                  class="rssi-fill"
                  :style="{ width: `${Math.max(0, (entry.rssi + 100) / 50 * 100)}%` }"
                />
              </span>
              <span class="rssi-val mono">{{ entry.rssi }} dBm</span>
            </li>
          </ul>
        </details>
      </section>

      <!-- Device Manager -->
      <section class="device-section">
        <DeviceManager />
      </section>
    </main>
  </div>
</template>

<style>
/* ── Reset & Base ──────────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: #060d1a;
  color: #e2e8f0;
  font-family: 'Segoe UI', system-ui, sans-serif;
  min-height: 100vh;
}
</style>

<style scoped>
/* ── App Layout ──────────────────────────────────────────────────────────*/
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ── Header ──────────────────────────────────────────────────────────────*/
.header {
  border-bottom: 1px solid #1e293b;
  padding: 16px 24px;
  background: #0a1628;
}
.header-inner {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.title {
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: -0.5px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.title-icon { font-size: 1.6rem; }

.connection-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  padding: 4px 12px;
  border-radius: 99px;
  background: #1e293b;
  color: #64748b;
  font-weight: 600;
}
.connection-badge.connected { color: #22c55e; }
.dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* ── Main ────────────────────────────────────────────────────────────────*/
.main {
  flex: 1;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* ── Status Panel ────────────────────────────────────────────────────────*/
.status-card {
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.status-label {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
  flex-shrink: 0;
}
.status-value { font-size: 0.95rem; font-weight: 600; }
.status-value.mono { font-family: monospace; color: #94a3b8; }
.status-value.highlight { color: #38bdf8; }

/* Confidence bar */
.confidence-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  justify-content: flex-end;
}
.confidence-bar {
  width: 100px; height: 6px;
  background: #1e293b;
  border-radius: 3px;
  overflow: hidden;
}
.confidence-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}
.confidence-fill.high { background: #22c55e; }
.confidence-fill.mid  { background: #f59e0b; }
.confidence-fill.low  { background: #ef4444; }
.confidence-label { font-size: 0.8rem; font-family: monospace; color: #94a3b8; min-width: 36px; }

/* RSSI Debug */
.rssi-debug {
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 12px;
  overflow: hidden;
}
.rssi-debug summary {
  padding: 14px 20px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 600;
  user-select: none;
}
.rssi-list {
  list-style: none;
  padding: 0 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.rssi-entry {
  display: flex;
  align-items: center;
  gap: 12px;
}
.beacon-id { font-size: 0.8rem; color: #94a3b8; min-width: 140px; }
.rssi-bar-mini {
  flex: 1;
  height: 4px;
  background: #1e293b;
  border-radius: 2px;
  overflow: hidden;
}
.rssi-fill {
  height: 100%;
  background: #38bdf8;
  border-radius: 2px;
  transition: width 0.4s ease;
}
.rssi-val { font-size: 0.78rem; color: #64748b; min-width: 64px; text-align: right; }
</style>
