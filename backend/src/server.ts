import http from 'http';
import app from './app';
import { config } from './configs';
import { logger } from './configs/logger';
import { connectDatabase } from './database/connection';
import { initRedis } from './configs/redis';
import { initializeSocket, setIO } from './sockets';
import { startWorkers } from './queues';

const startServer = async () => {
  await connectDatabase();
  await initRedis();

  const httpServer = http.createServer(app);
  const io = initializeSocket(httpServer);
  setIO(io);

  try {
    startWorkers();
  } catch (err) {
    logger.warn('Queue workers failed to start:', err);
  }

  httpServer.listen(config.port, () => {
    logger.info(`FleetFlow API running on port ${config.port} [${config.env}]`);
  });

  const shutdown = async () => {
    logger.info('Shutting down gracefully...');
    httpServer.close(() => process.exit(0));
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
