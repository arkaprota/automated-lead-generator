export interface RawScrapedLead {
  businessName: string;
  website?: string | null;
  phone?: string | null;
  address?: string | null;
  googlePlaceId?: string | null;
  rating?: number | null;
  reviewsCount?: number | null;
  categories?: string[];
  rawMetadata?: Record<string, unknown>;
}
