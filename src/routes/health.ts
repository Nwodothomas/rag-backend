import { Router } from 'express';
import { isOpenAIConfigured, isSupabaseConfigured } from '../utils/config.js';
import type { HealthReport } from '../utils/types.js';

const router = Router();

router.get('/', (_request, response) => {
  const report: HealthReport = {
    status: 'ok',
    service: 'rag-backend',
    timestamp: new Date().toISOString(),
    storage: isSupabaseConfigured() ? 'configured' : 'mock',
    openai: isOpenAIConfigured() ? 'configured' : 'mock',
  };

  response.json(report);
});

export default router;
