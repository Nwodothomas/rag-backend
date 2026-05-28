import { logger } from '../utils/logger.js';

export async function notifyIngestionEvent(event: string, payload: Record<string, unknown>): Promise<void> {
  logger.info(`Notifier event: ${event}`, payload);
}
