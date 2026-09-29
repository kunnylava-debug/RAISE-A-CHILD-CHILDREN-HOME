/**
 * Real-Time Multi-Device Synchronization Service (SSE)
 * Enables zero-refresh real-time updates across all connected mobile and desktop devices.
 */

const clients = new Set();

// Send heartbeat to all connected SSE clients every 25 seconds to keep connection alive
setInterval(() => {
  for (const client of clients) {
    try {
      client.write(': heartbeat\n\n');
    } catch (e) {
      clients.delete(client);
    }
  }
}, 25000);

/**
 * Handle new SSE connection from a client device
 */
export function handleSyncConnection(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'Real-time synchronization connected', timestamp: Date.now() })}\n\n`);

  clients.add(res);
  console.log(`[SYNC] Device connected. Total active connections: ${clients.size}`);

  req.on('close', () => {
    clients.delete(res);
    console.log(`[SYNC] Device disconnected. Total active connections: ${clients.size}`);
  });
}

/**
 * Broadcast an event to all connected devices across desktop and mobile
 * @param {Object} event { type: string, table: string, action: string, data?: any, timestamp?: number }
 */
export function broadcastSyncEvent(event) {
  const payload = {
    ...event,
    timestamp: event.timestamp || Date.now()
  };

  const formattedMessage = `data: ${JSON.stringify(payload)}\n\n`;

  let sentCount = 0;
  for (const client of clients) {
    try {
      client.write(formattedMessage);
      sentCount++;
    } catch (e) {
      clients.delete(client);
    }
  }

  if (sentCount > 0) {
    console.log(`[SYNC BROADCAST] Dispatched ${event.type} to ${sentCount} connected client(s)`);
  }
}
