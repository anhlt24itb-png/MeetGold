import http from 'http';
import { app } from './app';
import { ENV } from './config/env';
import { initDatabase } from './config/database';
import { initSignalingServer } from './websocket/signaling.server';

async function bootstrap() {
  // 1. Initialize Database connection (with graceful in-memory fallback)
  await initDatabase();

  // 2. Create HTTP Server
  const server = http.createServer(app);

  // 3. Initialize WebSocket Signaling Server
  initSignalingServer(server);

  // 4. Start Server on all network interfaces (LAN)
  server.listen(ENV.PORT, '0.0.0.0', () => {
    console.log(`=========================================`);
    console.log(`🚀 MeetDraw Server running on http://0.0.0.0:${ENV.PORT}`);
    console.log(`📡 WebSocket Signaling at ws://0.0.0.0:${ENV.PORT}/signaling`);
    console.log(`=========================================`);
  });
}

bootstrap().catch((err) => {
  console.error('[Server Bootstrap Failed]:', err);
  process.exit(1);
});
