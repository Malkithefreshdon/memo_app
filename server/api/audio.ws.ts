/**
 * WebSocket /api/audio — canal dashboard ↔ gateway
 *
 * La gateway se connecte, envoie { role:"gateway" } pour s'enregistrer,
 * puis reçoit des commandes JSON (ex. { cmd:"play_step", step:1 }).
 *
 * Le dashboard déclenche les étapes via POST /api/guidance/step,
 * qui appelle broadcastCommand() pour pousser la commande aux gateways.
 */
export default defineWebSocketHandler({
  open(peer) {
    console.log(`[WS] Peer connecté : ${peer.id}`)
  },

  message(peer, message) {
    try {
      const msg = JSON.parse(message.text())
      if (msg.role === 'gateway') {
        audioPeers.add(peer)
        peer.send(JSON.stringify({ type: 'registered', gateways: audioPeers.size }))
        console.log(`[WS] Gateway enregistrée : ${peer.id} (total: ${audioPeers.size})`)
      }
    } catch {
      // messages binaires ignorés — le canal n'est plus utilisé pour l'audio navigateur
    }
  },

  close(peer) {
    audioPeers.delete(peer)
    console.log(`[WS] Peer déconnecté : ${peer.id} (gateways: ${audioPeers.size})`)
  },

  error(peer, error) {
    audioPeers.delete(peer)
    console.error(`[WS] Erreur peer ${peer.id}:`, error)
  },
})
