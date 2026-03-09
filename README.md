# nuxt-iot-floorplan

Web app temps réel pour tracker la montre via les balises BLE.

## Stack

- **Nuxt 3** — frontend + API server
- **SSE** (Server-Sent Events) — push temps réel sans WebSocket
- **RSSI Trilatération** — estimation de pièce côté API

## Architecture

```
Montre
  └─► [RSSI scan] ──► RPi Gateway
                          └─► POST /api/location  (x-api-key header)
                                  └─► estimateRoom() ──► SSE bus ──► GET /api/stream
                                                                          └─► Frontend (FloorPlan)
```

## Setup

```bash
npm install
cp .env.example .env   # configurer GATEWAY_API_KEY
npm run dev
```

## Variables d'environnement

```env
GATEWAY_API_KEY=your-secret-key-here
```

## Config des balises BLE

Editer `server/utils/rssi.ts` → tableau `BEACONS` :

```ts
export const BEACONS: BeaconConfig[] = [
  { beacon_id: 'AA:BB:CC:DD:EE:01', room: 'chambre1' },
  { beacon_id: 'AA:BB:CC:DD:EE:02', room: 'chambre2' },
  { beacon_id: 'AA:BB:CC:DD:EE:03', room: 'chambre3' },
  { beacon_id: 'AA:BB:CC:DD:EE:04', room: 'couloir'  },
]
```

## Test rapide (sans RPi)

```bash
# Simuler une position dans Chambre 1
curl -X POST http://localhost:3000/api/location \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-secret-key" \
  -d '{
    "watch_id": "watch_001",
    "timestamp": 1712345678000,
    "rssi_data": [
      { "beacon_id": "beacon_chambre1", "rssi": -55 },
      { "beacon_id": "beacon_chambre2", "rssi": -85 },
      { "beacon_id": "beacon_chambre3", "rssi": -92 },
      { "beacon_id": "beacon_couloir",  "rssi": -78 }
    ]
  }'
```

## Payload Gateway (RPi → API)

```json
{
  "watch_id": "watch_001",
  "timestamp": 1712345678000,
  "rssi_data": [
    { "beacon_id": "beacon_chambre1", "rssi": -55 },
    { "beacon_id": "beacon_chambre2", "rssi": -82 }
  ]
}
```

| Champ | Type | Description |
|---|---|---|
| `watch_id` | string | Identifiant unique de la montre |
| `timestamp` | number | Unix ms |
| `rssi_data` | array | Tableau des beacons scannés |
| `estimated_room` | string? | Optionnel — si le gateway fait son propre calcul |

## Réponse API

```json
{
  "success": true,
  "estimated_room": "chambre1",
  "confidence": 0.87
}
```

## Deploy Coolify

1. Push le repo sur ton VPS
2. Créer une app Nuxt dans Coolify
3. Ajouter la variable `GATEWAY_API_KEY` dans les env vars Coolify
4. S'assurer que Coolify/Nginx a **`X-Accel-Buffering: no`** pour les SSE (déjà géré dans le header)

##  Script de test

# Mode normal (dans le projet)

node scripts/simulate-walk.mjs

# Pointer vers ton VPS

node scripts/simulate-walk.mjs --url <https://ton-vps.com> --key ton-api-key

# Boucle infinie (pratique pour laisser tourner pendant le dev frontend)

node scripts/simulate-walk.mjs --loop

# Mode rapide pour tester vite

node scripts/simulate-walk.mjs --fast
