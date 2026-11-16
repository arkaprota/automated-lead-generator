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
  pdfBrochureUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}
