import type { Request } from 'express';

// Tenant-aware authenticated Express Request
export interface AuthenticatedRequest extends Request {
  workspaceId?: string;
  userId?: string;
  userRole?: string;
}

// Gemini Structured Output Types
export interface QueryExpansionResponse {
  queries: string[];
  rationale: string;
}

export interface LeadScoringResponse {
  leadScore: number; // 0 to 100
  qualificationStatus: 'hot' | 'warm' | 'cold' | 'disqualified';
  reasons: string[];
  keyStrengths: string[];
  recommendedPitchAngle: string;
}

export interface BrochurePitchResponse {
  headline: string;
  painPoints: string[];
  tailoredSolution: string;
  estimatedRoi: string;
  callToAction: string;
}

export type ReplyIntent = 'INTERESTED' | 'NOT_INTERESTED' | 'QUESTION' | 'NEUTRAL';

export interface ReplyClassificationResponse {
  intent: ReplyIntent;
  confidence: number;
  summary: string;
  suggestedAction: string;
}

// Scraped Google Maps Lead interface
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

// Socket.io Real-Time Event Payloads
export interface SocketEvents {
  'lead:positive_reply': {
    workspaceId: string;
    campaignId: string;
    leadId: string;
    businessName: string;
    intent: 'INTERESTED';
    replySnippet: string;
    receivedAt: string;
  };
  'lead:generation_progress': {
    workspaceId: string;
    currentStep: 'expanding_queries' | 'scraping_data' | 'qualifying_leads' | 'completed';
    totalProcessed: number;
    qualifiedCount: number;
  };
}

export * from './search-event.interface.js';
