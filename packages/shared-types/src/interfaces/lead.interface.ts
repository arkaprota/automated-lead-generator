import { LeadStatus } from '../enums/lead-status.enum.js';

export interface ILead {
  id: string;
  workspaceId: string;
  name: string;
  googlePlaceId?: string | null;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  category?: string | null;
  leadScore: number;
  status: LeadStatus;
  qualificationReasons: string[];
  pdfBrochureUrl?: string | null;
  eventId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
