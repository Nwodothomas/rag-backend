import { Router } from 'express';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { queryKnowledgeBase } from '../services/ragPipeline.js';
import type { QueryRequest } from '../utils/types.js';

const router = Router();

router.post('/', rateLimiter, async (request, response, next) => {
  try {
    const body = request.body as QueryRequest;
    if (!body.question?.trim()) {
      response.status(400).json({ error: 'A question is required.' });
      return;
    }

    const result = await queryKnowledgeBase(body);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
