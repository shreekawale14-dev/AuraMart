import app from './app.js';
import { connectDB } from './config/db.js';
import { ENV } from './config/env.js';

const startServer = async () => {
  await connectDB();

  const server = app.listen(ENV.PORT, () => {
    console.log(`[AuraMart Server] Running on http://localhost:${ENV.PORT}`);
    console.log(`[AuraMart Server] Healthcheck available at http://localhost:${ENV.PORT}/api/health`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('[AuraMart Server] Gracefully shutting down...');
    server.close(() => {
      console.log('[AuraMart Server] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer();

