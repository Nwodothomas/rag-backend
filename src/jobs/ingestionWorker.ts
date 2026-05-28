import { logger } from '../utils/logger.js';
import { ingestFile } from '../services/ragPipeline.js';

export async function runIngestionWorker(fileId: string): Promise<void> {
  logger.info('Ingestion worker started', { fileId });
  await ingestFile(fileId);
}
