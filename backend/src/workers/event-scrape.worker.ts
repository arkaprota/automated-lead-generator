import { Worker, type Job } from 'bullmq';
import { getRedisClient } from '../config/redis.js';
import {
  EVENT_SCRAPE_QUEUE_NAME,
  EventSchedulerService,
  type SearchEventJobData,
} from '../services/event-scheduler.service.js';

let eventWorker: Worker<SearchEventJobData> | null = null;

export class EventScrapeWorker {
  /**
   * Initialize BullMQ worker for search event scraping
   */
  static initWorker(): Worker<SearchEventJobData> {
    if (!eventWorker) {
      eventWorker = new Worker<SearchEventJobData>(
        EVENT_SCRAPE_QUEUE_NAME,
        async (job: Job<SearchEventJobData>) => {
          console.log(`[EventScrapeWorker] Processing scrape job ${job.id} for event ${job.data.eventId} in workspace ${job.data.workspaceId}`);
          return await EventSchedulerService.executeEventScrape(job.data.eventId, job.data.workspaceId);
        },
        {
          connection: getRedisClient(),
          concurrency: 3,
        }
      );

      eventWorker.on('completed', (job) => {
        console.log(`[EventScrapeWorker] Job ${job.id} completed successfully for event ${job.data.eventId}.`);
      });

      eventWorker.on('failed', (job, err) => {
        console.error(`[EventScrapeWorker] Job ${job?.id} failed for event ${job?.data?.eventId}:`, err.message);
      });
    }
    return eventWorker;
  }
}
