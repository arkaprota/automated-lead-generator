import { EventStatus } from './event-status.enum';

export interface SearchEventItem {
  id: string;
  workspaceId: string;
  name: string;
  category: string;
  location: string;
  scheduleCron: string;
  status: EventStatus | 'active' | 'stopped' | 'completed' | 'failed';
  queryPrompt?: string | null;
  totalLeadsFound: number;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventPayload {
  name: string;
  category: string;
  location: string;
  scheduleCron?: string;
  queryPrompt?: string;
}

export interface EventLeadItem {
  id: string;
  workspaceId: string;
  eventId?: string | null;
  businessName: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  googlePlaceId?: string | null;
  leadScore: number;
  qualificationStatus: string;
  qualificationReasons: string[];
  rawMetadata?: {
    rating?: number;
    reviewsCount?: number;
    keyStrengths?: string[];
    pitchAngle?: string;
    categories?: string[];
  };
  createdAt: string;
}
