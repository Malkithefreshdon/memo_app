<script setup lang="ts">
/**
 * Plan SVG de l'étage avec 3 chambres + couloir.
 * Adapter les coordonnées SVG à ton vrai plan si besoin.
 */

interface Room {
  id: string
  label: string
  x: number
  y: number
  width: number
  height: number
}

const props = defineProps<{
  activeRoom: string | null
  confidence: number
}>()

// ── Définition des pièces ────────────────────────────────────────────────
// Coordonnées dans un viewport SVG 400x300
const rooms: Room[] = [
  { id: 'chambre1', label: 'Chambre 1',  x: 10,  y: 10,  width: 150, height: 130 },
  { id: 'chambre2', label: 'Chambre 2',  x: 240, y: 10,  width: 150, height: 130 },
  { id: 'chambre3', label: 'Chambre 3',  x: 10,  y: 160, width: 150, height: 130 },
  { id: 'couloir',  label: 'Couloir',    x: 170, y: 10,  width: 60,  height: 280 },
]

function isActive(roomId: string): boolean {
  return props.activeRoom === roomId
}

function roomColor(roomId: string): string {
  if (!isActive(roomId)) return '#1e293b' // dark idle
  // Couleur basée sur la confidence : orange si faible, vert si haute
  const c = props.confidence
  if (c >= 0.75) return '#22c55e'  // vert
  if (c >= 0.45) return '#f59e0b'  // orange
  return '#ef4444'                  // rouge (position incertaine)
}

function strokeColor(roomId: string): string {
  return isActive(roomId) ? '#ffffff' : '#334155'
}
</script>

<template>
  <div class="floor-plan-wrapper">
    <svg
      viewBox="0 0 400 300"
      xmlns="http://www.w3.org/2000/svg"
      class="floor-plan"
      aria-label="Plan de l'étage"
    >
      <!-- Fond -->
      <rect width="400" height="300" fill="#0f172a" rx="8" />

      <!-- Pièces -->
      <g v-for="room in rooms" :key="room.id">
        <rect
          :x="room.x"
          :y="room.y"
          :width="room.width"
          :height="room.height"
          :fill="roomColor(room.id)"
          :stroke="strokeColor(room.id)"
          stroke-width="1.5"
          rx="4"
          class="room-rect"
          :class="{ active: isActive(room.id) }"
        />

        <!-- Icône montre si pièce active -->
        <text
          v-if="isActive(room.id)"
          :x="room.x + room.width / 2"
          :y="room.y + room.height / 2 - 14"
          text-anchor="middle"
          font-size="20"
        >⌚</text>

        <!-- Label de la pièce -->
        <text
          :x="room.x + room.width / 2"
          :y="room.y + room.height / 2 + (isActive(room.id) ? 12 : 0)"
          text-anchor="middle"
          dominant-baseline="middle"
          fill="white"
          font-family="monospace"
          font-size="12"
          font-weight="600"
          opacity="0.9"
        >
          {{ room.label }}
        </text>

        <!-- Barre de confidence sous le label si actif -->
        <g v-if="isActive(room.id)">
          <rect
            :x="room.x + room.width / 2 - 30"
            :y="room.y + room.height / 2 + 22"
            width="60"
            height="4"
            fill="#0f172a"
            rx="2"
          />
          <rect
            :x="room.x + room.width / 2 - 30"
            :y="room.y + room.height / 2 + 22"
            :width="60 * confidence"
            height="4"
            :fill="roomColor(room.id)"
            rx="2"
            opacity="0.8"
          />
        </g>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.floor-plan-wrapper {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.floor-plan {
  width: 100%;
  height: auto;
  border-radius: 12px;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.5);
}

.room-rect {
  transition: fill 0.4s ease, stroke 0.4s ease;
}

.room-rect.active {
  filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.6));
}
</style>
