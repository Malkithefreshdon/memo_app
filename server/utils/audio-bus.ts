declare global {
  // eslint-disable-next-line no-var
  var __audioPeers: Set<any> | undefined
}

if (!global.__audioPeers) global.__audioPeers = new Set()

export const audioPeers = global.__audioPeers

export function broadcastChunk(data: Buffer): void {
  for (const peer of audioPeers) {
    try {
      peer.send(data)
    } catch {
      audioPeers.delete(peer)
    }
  }
}

// Envoie une commande JSON à toutes les gateways enregistrées.
// Utilisé pour déclencher une étape de guidage depuis le dashboard.
export function broadcastCommand(cmd: object): void {
  const msg = JSON.stringify(cmd)
  for (const peer of audioPeers) {
    try {
      peer.send(msg)
    } catch {
      audioPeers.delete(peer)
    }
  }
}
