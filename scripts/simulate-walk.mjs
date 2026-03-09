/**
 * simulate-walk.mjs
 * Simule un porteur qui se déplace de pièce en pièce avec des RSSI plausibles.
 *
 * Usage:
 *   node simulate-walk.mjs
 *   node simulate-walk.mjs --url http://mon-vps.com --key my-secret
 *   node simulate-walk.mjs --loop   (rejoue indéfiniment)
 */

// ── Config CLI ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const getArg = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : null }

const API_URL = getArg('--url') ?? 'http://localhost:3000'
const API_KEY = getArg('--key') ?? 'memo-guide-gateway-xp550e'
const WATCH_ID = getArg('--watch') ?? 'watch_001'
const LOOP = args.includes('--loop')
const FAST = args.includes('--fast') // réduit les délais pour tests rapides

const ENDPOINT = `${API_URL}/api/location`

// ── Balises BLE ───────────────────────────────────────────────────────────────
// Chaque balise est associée à une pièce.
// Le RSSI "au repos" représente le signal quand on est dans la pièce de la balise.
const BEACONS = [
  { id: 'beacon_chambre1', room: 'chambre1' },
  { id: 'beacon_chambre2', room: 'chambre2' },
  { id: 'beacon_chambre3', room: 'chambre3' },
  { id: 'beacon_couloir', room: 'couloir' },
]

// ── Modèle RSSI ───────────────────────────────────────────────────────────────
// RSSI estimé selon la distance perçue entre le porteur et chaque balise.
// base_rssi : signal fort quand on est dans la pièce de la balise
// decay     : atténuation par pièce traversée (murs BLE ~10-15 dBm/mur)
const ROOM_BASE_RSSI = {
  chambre1: { beacon_chambre1: -48, beacon_chambre2: -85, beacon_chambre3: -88, beacon_couloir: -72 },
  chambre2: { beacon_chambre1: -87, beacon_chambre2: -50, beacon_chambre3: -82, beacon_couloir: -68 },
  chambre3: { beacon_chambre1: -90, beacon_chambre2: -84, beacon_chambre3: -47, beacon_couloir: -70 },
  couloir: { beacon_chambre1: -73, beacon_chambre2: -69, beacon_chambre3: -71, beacon_couloir: -52 },
}

// ── Parcours simulé ───────────────────────────────────────────────────────────
// Chaque étape = pièce cible + durée de séjour
const WALK_SCENARIO = [
  { room: 'chambre1', stay: ms(8) },  // dans la chambre 1
  { room: 'couloir', stay: ms(4) },  // traverse le couloir
  { room: 'chambre2', stay: ms(10) },  // visite chambre 2
  { room: 'couloir', stay: ms(3) },  // retour couloir
  { room: 'chambre3', stay: ms(12) },  // longue visite chambre 3
  { room: 'couloir', stay: ms(5) },  // couloir
  { room: 'chambre1', stay: ms(6) },  // retour chambre 1
]

const TRANSITION_STEPS = FAST ? 4 : 8   // frames pendant la transition entre 2 pièces
const TRANSITION_MS = FAST ? 300 : 700 // ms entre chaque frame de transition
const STAY_INTERVAL_MS = FAST ? 500 : 1500 // ms entre envois pendant le séjour

// ── Utils ─────────────────────────────────────────────────────────────────────
function ms(seconds) { return FAST ? seconds * 200 : seconds * 1000 }

/** Ajoute du bruit gaussien (Box-Muller) simulant les fluctuations BLE */
function rssiNoise(sigma = 3) {
  const u1 = Math.random(), u2 = Math.random()
  return Math.round(Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * sigma)
}

/** Interpole les RSSI entre deux pièces (t = 0..1) */
function interpolateRssi(fromRoom, toRoom, t) {
  const from = ROOM_BASE_RSSI[fromRoom]
  const to = ROOM_BASE_RSSI[toRoom]
  return BEACONS.map(b => {
    const base = from[b.id] + (to[b.id] - from[b.id]) * t + rssiNoise(4)
    return { beacon_id: b.id, rssi: Math.round(Math.max(-100, Math.min(-30, base))) }
  })
}

/** RSSI stable dans une pièce avec bruit naturel */
function stableRssi(room) {
  const base = ROOM_BASE_RSSI[room]
  return BEACONS.map(b => ({
    beacon_id: b.id,
    rssi: Math.round(Math.max(-100, Math.min(-30, base[b.id] + rssiNoise(2.5)))),
  }))
}

/** POST vers l'API */
async function sendLocation(rssiData) {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      body: JSON.stringify({ watch_id: WATCH_ID, timestamp: Date.now(), rssi_data: rssiData }),
    })
    const json = await res.json()
    return json
  } catch (err) {
    console.error(`  ✗ Erreur réseau: ${err.message}`)
    return null
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function bar(rssi) {
  const filled = Math.round(Math.max(0, (rssi + 100) / 60 * 12))
  return '[' + '█'.repeat(filled) + '░'.repeat(12 - filled) + ']'
}

function confidenceColor(c) {
  if (c >= 0.75) return '\x1b[32m'       // vert
  if (c >= 0.45) return '\x1b[33m'       // orange
  return '\x1b[31m'                       // rouge
}
const RESET = '\x1b[0m'
const DIM = '\x1b[2m'
const BOLD = '\x1b[1m'
const CYAN = '\x1b[36m'

// ── Boucle principale ─────────────────────────────────────────────────────────
async function runScenario() {
  console.log(`\n${BOLD}🚶 Simulation de marche — Watch Tracker${RESET}`)
  console.log(`${DIM}  endpoint : ${ENDPOINT}`)
  console.log(`  watch_id : ${WATCH_ID}`)
  console.log(`  mode     : ${FAST ? 'rapide' : 'normal'}${LOOP ? ' · boucle infinie' : ''}${RESET}\n`)

  for (let i = 0; i < WALK_SCENARIO.length; i++) {
    const current = WALK_SCENARIO[i]
    const prev = WALK_SCENARIO[i - 1]

    // ── Transition ────────────────────────────────────────────────────────
    if (prev && prev.room !== current.room) {
      console.log(`\n${CYAN}🚶 Transition : ${prev.room} → ${current.room}${RESET}`)
      for (let step = 1; step <= TRANSITION_STEPS; step++) {
        const t = step / TRANSITION_STEPS
        const rssi = interpolateRssi(prev.room, current.room, t)
        const result = await sendLocation(rssi)

        const roomDetected = result?.estimated_room ?? '?'
        const conf = result?.confidence ?? 0
        const confStr = `${confidenceColor(conf)}${Math.round(conf * 100)}%${RESET}`
        process.stdout.write(
          `  step ${step}/${TRANSITION_STEPS}  → détecté: ${BOLD}${roomDetected.padEnd(10)}${RESET} conf: ${confStr}\n`
        )
        await sleep(TRANSITION_MS)
      }
    }

    // ── Séjour stable ──────────────────────────────────────────────────────
    const stayMs = current.stay
    const ticks = Math.max(1, Math.floor(stayMs / STAY_INTERVAL_MS))
    console.log(`\n📍 Dans ${BOLD}${current.room}${RESET} pendant ~${Math.round(stayMs / 1000)}s (${ticks} mesures)`)

    for (let t = 0; t < ticks; t++) {
      const rssi = stableRssi(current.room)
      const result = await sendLocation(rssi)

      const roomDetected = result?.estimated_room ?? '?'
      const conf = result?.confidence ?? 0
      const confColor = confidenceColor(conf)

      // Afficher les RSSI de façon lisible
      const rssiStr = rssi
        .map(e => `${DIM}${e.beacon_id.replace('beacon_', '').padEnd(10)}${RESET} ${bar(e.rssi)} ${e.rssi}`)
        .join('  ')

      console.log(
        `  [${t + 1}/${ticks}] → ${BOLD}${roomDetected.padEnd(10)}${RESET} ` +
        `conf: ${confColor}${Math.round(conf * 100)}%${RESET}  ${DIM}${rssiStr}${RESET}`
      )
      await sleep(STAY_INTERVAL_MS)
    }
  }

  console.log(`\n✅ Scénario terminé.\n`)
}

// ── Entrée ────────────────────────────────────────────────────────────────────
async function main() {
  do {
    await runScenario()
    if (LOOP) {
      console.log(`${DIM}🔁 Redémarrage du scénario dans 2s...${RESET}`)
      await sleep(2000)
    }
  } while (LOOP)
}

main().catch(err => { console.error(err); process.exit(1) })
