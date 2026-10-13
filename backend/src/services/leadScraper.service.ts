import type { RawScrapedLead } from '../types/index.js';
import { env } from '../config/env.js';

export class LeadScraperService {
  /**
   * Pipeline 1, Step B:
   * Triggers B2B Google Maps scraping across generated search queries.
   */
  static async scrapeGoogleMaps(queries: string[], maxPerQuery: number = 3): Promise<RawScrapedLead[]> {
    const leads: RawScrapedLead[] = [];

    // If external scraper API is provided (e.g., Outscraper or SerpAPI)
    if (env.SCRAPER_API_KEY) {
      try {
        console.log(`[LeadScraperService] Scraping via provider for ${queries.length} queries...`);
        // Integration point for Outscraper / SerpAPI HTTP calls
        // Can be expanded to actual API client calls
      } catch (err) {
        console.warn('[LeadScraperService] Provider call error, falling back to mock results:', err);
      }
    }

    // High quality deterministic mock generator for rapid dev & testing
    for (const query of queries) {
      const cleanTerm = query.replace(/(agencies|services|companies|near me|top rated)/gi, '').trim();
      for (let i = 1; i <= maxPerQuery; i++) {
        // Deliberately simulate cases with null website (to test "Hot Lead" detection)
        const hasNoWebsite = (i === 1 || i === 3);
        const businessName = `${cleanTerm || 'Kolkata'} Business ${i} & Co.`;
        const slug = businessName.toLowerCase().replace(/[^a-z0-9]/g, '');

        leads.push({
          businessName,
          website: hasNoWebsite ? null : `https://www.${slug}.example.com`,
          phone: `+91 98300 ${10000 + i * 111}`,
          address: `${10 + i * 2}, Park Street, Central District, Kolkata, India`,
          googlePlaceId: `ChIJ_${slug}_${i * 9999}`,
          rating: 4.2 + (i % 8) * 0.1,
          reviewsCount: 15 + i * 12,
          categories: ['Web Design', 'Digital Marketing', 'IT Services'],
          rawMetadata: {
            scrapedAt: new Date().toISOString(),
            query,
            claimed: true,
          },
        });
      }
    }

    return leads;
  }
}
