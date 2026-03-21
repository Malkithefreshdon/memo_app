<script setup lang="ts">
import { ref } from 'vue'
import type { AppState, DeviceEntity } from '~/types'

const { data: response, refresh } = await useFetch<{ success: boolean; data: AppState }>('/api/devices')

const state = computed(() => response.value?.data || { watches: {}, beacons: {}, gateways: {} })

const rooms = [
  { id: 'chambre1', label: 'Chambre 1' },
  { id: 'chambre2', label: 'Chambre 2' },
  { id: 'chambre3', label: 'Chambre 3' },
  { id: 'couloir', label: 'Couloir' },
]

async function saveDevice(type: 'watch'|'beacon'|'gateway', device: DeviceEntity) {
  try {
    await $fetch('/api/devices', {
      method: 'POST',
      body: {
        type,
        id: device.id,
        name: device.name,
        room: device.room
      }
    })
    // Optionally show a success toast or inline message
    alert(`Sauvegardé : ${device.name}`)
  } catch (err) {
    console.error(err)
    alert('Erreur lors de la sauvegarde')
  }
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleString()
}
</script>

<template>
  <div class="device-manager">
    <h2 class="title">Gestion du Matériel</h2>

    <div class="grid">
      <!-- M O N T R E S -->
      <div class="card">
        <h3>⌚ Montres ({{ Object.keys(state.watches).length }})</h3>
        <div v-for="w in state.watches" :key="w.id" class="device-row">
          <div class="device-info">
            <span class="mono id-badge">{{ w.id }}</span>
            <span class="last-seen">Vue: {{ formatDate(w.lastSeen) }}</span>
          </div>
          <div class="device-actions">
            <input v-model="w.name" type="text" placeholder="Nom de la montre" class="device-input" />
            <button @click="saveDevice('watch', w)" class="btn-save">Enregistrer</button>
          </div>
        </div>
        <p v-if="Object.keys(state.watches).length === 0" class="empty">Aucune montre détectée</p>
      </div>

      <!-- B A L I S E S -->
      <div class="card">
        <h3>📡 Balises ({{ Object.keys(state.beacons).length }})</h3>
        <div v-for="b in state.beacons" :key="b.id" class="device-row">
          <div class="device-info">
            <span class="mono id-badge">{{ b.id }}</span>
            <span class="last-seen">Vue: {{ formatDate(b.lastSeen) }}</span>
          </div>
          <div class="device-actions">
            <input v-model="b.name" type="text" placeholder="Nom de la balise" class="device-input" />
            <select v-model="b.room" class="device-select">
              <option :value="null">-- Non assigné --</option>
              <option v-for="r in rooms" :key="r.id" :value="r.id">{{ r.label }}</option>
            </select>
            <button @click="saveDevice('beacon', b)" class="btn-save">Enregistrer</button>
          </div>
        </div>
        <p v-if="Object.keys(state.beacons).length === 0" class="empty">Aucune balise détectée</p>
      </div>

      <!-- G A T E W A Y S -->
      <div class="card">
        <h3>📟 Gateways ({{ Object.keys(state.gateways).length }})</h3>
        <div v-for="g in state.gateways" :key="g.id" class="device-row">
          <div class="device-info">
            <span class="mono id-badge">{{ g.id }}</span>
            <span class="last-seen">Vue: {{ formatDate(g.lastSeen) }}</span>
          </div>
          <div class="device-actions">
            <input v-model="g.name" type="text" placeholder="Nom du gateway" class="device-input" />
            <button @click="saveDevice('gateway', g)" class="btn-save">Enregistrer</button>
          </div>
        </div>
        <p v-if="Object.keys(state.gateways).length === 0" class="empty">Aucun gateway détecté</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.device-manager {
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 24px;
  color: #e2e8f0;
}

.title {
  margin-bottom: 24px;
  font-size: 1.2rem;
  font-weight: 600;
  color: #f8fafc;
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

.card {
  background: #1e293b;
  border-radius: 8px;
  padding: 16px;
}

h3 {
  font-size: 1rem;
  margin-bottom: 16px;
  color: #38bdf8;
  border-bottom: 1px solid #334155;
  padding-bottom: 8px;
  font-weight: 500;
}

.device-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #334155;
}
.device-row:last-child {
  border-bottom: none;
}

.device-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}

.id-badge {
  background: #0f172a;
  padding: 4px 8px;
  border-radius: 4px;
  color: #94a3b8;
  font-family: monospace;
}

.last-seen {
  color: #64748b;
  font-size: 0.75rem;
}

.device-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.device-input, .device-select {
  flex: 1;
  min-width: 150px;
  padding: 8px 12px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  color: #f1f5f9;
  font-size: 0.9rem;
}
.device-input:focus, .device-select:focus {
  outline: none;
  border-color: #38bdf8;
}

.btn-save {
  padding: 8px 16px;
  background: #38bdf8;
  color: #0f172a;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn-save:hover {
  opacity: 0.9;
}

.empty {
  font-size: 0.9rem;
  color: #64748b;
  font-style: italic;
  padding: 10px 0;
}
</style>
