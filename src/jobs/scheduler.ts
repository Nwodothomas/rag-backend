import { logger } from '../utils/logger.js';

let schedulerHandle: NodeJS.Timeout | null = null;

export function startScheduler(intervalMs = 15 * 60 * 1000): void {
  if (schedulerHandle) {
    return;
  }

  schedulerHandle = setInterval(() => {
    logger.info('Scheduled ingestion sweep executed');
  }, intervalMs);
}

export function stopScheduler(): void {
  if (schedulerHandle) {
    clearInterval(schedulerHandle);
    schedulerHandle = null;
  }
}
