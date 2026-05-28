import { Router } from 'express';
import { requireAdmin } from '../middleware/authMiddleware.js';
import { ingestFile } from '../services/ragPipeline.js';
import { updateFile } from '../services/supabaseClient.js';

const router = Router();

router.post('/:fileId', requireAdmin, async (request, response, next) => {
  try {
    const { fileId } = request.params;
    await updateFile(fileId, { status: 'queued' });
    const result = await ingestFile(fileId);
    response.json({
      message: 'Ingestion completed',
      result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
