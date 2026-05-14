<script setup lang="ts">
const INSTRUCTIONS = [
  { id: 'turn_right',  label: 'Couloir à droite', icon: '→' },
  { id: 'turn_left',   label: 'Couloir à gauche', icon: '←' },
  { id: 'go_straight', label: 'Continuer tout droit', icon: '↑' },
  { id: 'stairs_up',   label: 'Monter l\'escalier', icon: '⬆' },
  { id: 'elevator',    label: 'Prendre l\'ascenseur', icon: '🛗' },
  { id: 'arrived',     label: 'Arrivée', icon: '✓' },
] as const

type Status = 'idle' | 'sending' | 'ok' | 'error'

const watchIp  = ref('192.168.1.30')
const status   = ref<Status>('idle')
const lastSent = ref('')
const errMsg   = ref('')

async function send(id: string) {
  status.value = 'sending'
  lastSent.value = id
  errMsg.value = ''
  try {
    await $fetch('/api/guidance/send', {
      method: 'POST',
      body: { id, watchIp: watchIp.value },
    })
    status.value = 'ok'
  } catch (e: any) {
    errMsg.value = e?.data?.message ?? 'Erreur réseau'
    status.value = 'error'
  } finally {
    setTimeout(() => { if (status.value !== 'sending') status.value = 'idle' }, 2500)
  }
}

async function stop() {
  await $fetch('/api/guidance/send', {
    method: 'POST',
    body: { id: '__stop__', watchIp: watchIp.value },
  }).catch(() => {})
}
</script>

<template>
  <div class="guidance-panel">
    <div class="panel-header">
      <span class="panel-title">Guidage montre</span>
      <div class="watch-ip">
        <span class="ip-label">IP</span>
        <input v-model="watchIp" class="ip-input" placeholder="192.168.1.30" spellcheck="false" />
      </div>
    </div>

    <div class="instructions-grid">
      <button
        v-for="inst in INSTRUCTIONS"
        :key="inst.id"
        class="inst-btn"
        :class="{
          sending: status === 'sending' && lastSent === inst.id,
          ok:      status === 'ok'      && lastSent === inst.id,
          error:   status === 'error'   && lastSent === inst.id,
        }"
        :disabled="status === 'sending'"
        @click="send(inst.id)"
      >
        <span class="inst-icon">{{ inst.icon }}</span>
        <span class="inst-label">{{ inst.label }}</span>
      </button>
    </div>

    <div class="panel-footer">
      <span v-if="status === 'error'" class="feedback error">{{ errMsg }}</span>
      <span v-else-if="status === 'ok'" class="feedback ok">Envoyé</span>
      <button class="stop-btn" @click="stop">Effacer l'affichage</button>
    </div>
  </div>
</template>

<style scoped>
.guidance-panel {
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 12px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #1e293b;
}
.panel-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
}
.watch-ip {
  display: flex;
  align-items: center;
  gap: 6px;
}
.ip-label {
  font-size: 0.72rem;
  color: #475569;
  font-family: monospace;
}
.ip-input {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 6px;
  color: #94a3b8;
  font-family: monospace;
  font-size: 0.78rem;
  padding: 3px 8px;
  width: 130px;
  outline: none;
}
.ip-input:focus { border-color: #475569; }

.instructions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 16px;
}

.inst-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 0.83rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
  text-align: left;
}
.inst-btn:hover:not(:disabled) {
  background: #253347;
  border-color: #475569;
}
.inst-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.inst-btn.sending  { border-color: #f59e0b; background: #1c1a0e; }
.inst-btn.ok       { border-color: #22c55e; background: #0a1f0f; }
.inst-btn.error    { border-color: #ef4444; background: #1f0a0a; }

.inst-icon { font-size: 1.1rem; flex-shrink: 0; }
.inst-label { font-size: 0.8rem; line-height: 1.2; }

.panel-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-top: 1px solid #1e293b;
  min-height: 44px;
}

.feedback { font-size: 0.8rem; font-family: monospace; }
.feedback.ok    { color: #22c55e; }
.feedback.error { color: #ef4444; }

.stop-btn {
  margin-left: auto;
  padding: 5px 12px;
  background: transparent;
  border: 1px solid #334155;
  border-radius: 6px;
  color: #64748b;
  font-size: 0.78rem;
  cursor: pointer;
  transition: border-color 0.12s, color 0.12s;
}
.stop-btn:hover { border-color: #475569; color: #94a3b8; }
</style>
