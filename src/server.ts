import express from 'express';
import healthRoutes from './routes/health.js';
import uploadRoutes from './routes/upload.js';
import ingestRoutes from './routes/ingest.js';
import queryRoutes from './routes/query.js';
import adminRoutes from './routes/admin.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { config } from './utils/config.js';
import { logger } from './utils/logger.js';
import { startScheduler } from './jobs/scheduler.js';

export function createServerApp() {
  const app = express();

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/', (_request, response) => {
    response.json({
      service: 'rag-backend',
      version: '1.0.0',
      docs: '/health',
    });
  });

  app.use('/health', healthRoutes);
  app.use('/upload', uploadRoutes);
  app.use('/ingest', ingestRoutes);
  app.use('/query', queryRoutes);
  app.use('/admin', adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export function startServer() {
  const app = createServerApp();
  const server = app.listen(config.port, () => {
    logger.info('RAG backend server started', {
      port: config.port,
      environment: config.nodeEnv,
    });
  });

  startScheduler();
  return server;
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
