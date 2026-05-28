import { Router } from 'express';
import { requireAdmin } from '../middleware/authMiddleware.js';
import { getPipelineStats, ingestFile } from '../services/ragPipeline.js';
import { getFile, listFiles } from '../services/supabaseClient.js';

const router = Router();

router.use(requireAdmin);

router.get('/files', async (_request, response, next) => {
  try {
    const files = await listFiles();
    response.json({ files });
  } catch (error) {
    next(error);
  }
});

router.get('/files/:fileId', async (request, response, next) => {
  try {
    const file = await getFile(request.params.fileId);
    if (!file) {
      response.status(404).json({ error: 'File not found' });
      return;
    }

    response.json({ file });
  } catch (error) {
    next(error);
  }
});

router.post('/reingest/:fileId', async (request, response, next) => {
  try {
    const result = await ingestFile(request.params.fileId);
    response.json({
      message: 'Re-ingestion completed',
      result,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/stats', async (_request, response, next) => {
  try {
    const stats = await getPipelineStats();
    response.json({ stats });
  } catch (error) {
    next(error);
  }
});

export default router;
