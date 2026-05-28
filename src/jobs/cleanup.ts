import { logger } from '../utils/logger.js';

export async function cleanupStaleArtifacts(): Promise<void> {
  logger.info('Cleanup job executed');
}
