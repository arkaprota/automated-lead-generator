export type Integration = 'scraper' | 'email' | 'storage' | 'ai' | 'database';

const LABELS: Record<Integration, string> = {
  scraper: 'Lead scraper',
  email: 'Email provider',
  storage: 'Brochure storage',
  ai: 'AI provider',
  database: 'Database',
};

/** A required external integration is missing or unreachable; surfaced to clients as HTTP 503. */
export class IntegrationNotConfiguredError extends Error {
  readonly status = 503;

  constructor(readonly integration: Integration, reason: 'not configured' | 'unavailable' = 'not configured') {
    super(`${LABELS[integration]} ${reason}`);
    this.name = 'IntegrationNotConfiguredError';
  }
}
