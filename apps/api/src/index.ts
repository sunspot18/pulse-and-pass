import { app } from './app.js';
import { ENV } from './config/env.js';
import { initDb } from './config/db.js';
import { ExpiryWorker } from './services/expiry-worker.service.js';

async function bootstrap() {
  await initDb();
  ExpiryWorker.start(15000);

  const server = app.listen(ENV.PORT, () => {
    console.log(`🎟️  Pulse & Pass API listening on http://localhost:${ENV.PORT}`);
    console.log(`📡  Environment: ${ENV.NODE_ENV}`);
    console.log(`🩺  Health Check: http://localhost:${ENV.PORT}/api/v1/health`);
  });

  const gracefulShutdown = () => {
    console.log('\n🛑  Shutting down Pulse & Pass API gracefully...');
    ExpiryWorker.stop();
    server.close(() => {
      console.log('🏁  HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

bootstrap().catch((err) => {
  console.error('Fatal API bootstrap error:', err);
  process.exit(1);
});
