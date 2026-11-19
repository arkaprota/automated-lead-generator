import type { RawScrapedLead } from '../types/index.js';
import { IntegrationNotConfiguredError } from '../errors/integration-not-configured.error.js';

export class LeadScraperService {
  /**
   * Pipeline 1, Step B: scrape Google Maps B2B records for the generated queries.
   * No scraping provider is integrated yet, so this fails honestly instead of returning invented businesses.
   */
  static async scrapeGoogleMaps(_queries: string[], _maxPerQuery: number = 3): Promise<RawScrapedLead[]> {
    throw new IntegrationNotConfiguredError('scraper');
  }
}
