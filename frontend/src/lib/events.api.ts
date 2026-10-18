const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface SearchEventItem {
  id: string;
  workspaceId: string;
  name: string;
  category: string;
  location: string;
  scheduleCron: string;
  status: 'active' | 'stopped' | 'completed' | 'failed';
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
  };
  pdfBrochureUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function fetchEvents(workspaceId: string, status?: string): Promise<{ success: boolean; events: SearchEventItem[] }> {
  const url = new URL(`${API_URL}/events`);
  if (status) url.searchParams.append('status', status);

  const res = await fetch(url.toString(), {
    headers: {
      'x-workspace-id': workspaceId,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch automated search events');
  }

  return res.json();
}

export async function createSearchEvent(workspaceId: string, payload: CreateEventPayload): Promise<{ success: boolean; event: SearchEventItem }> {
  const res = await fetch(`${API_URL}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-workspace-id': workspaceId,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create search event');
  }

  return res.json();
}

export async function toggleEventStatus(
  workspaceId: string,
  eventId: string,
  status: 'active' | 'stopped'
): Promise<{ success: boolean; event: SearchEventItem }> {
  const res = await fetch(`${API_URL}/events/${eventId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-workspace-id': workspaceId,
    },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    throw new Error('Failed to update event status');
  }

  return res.json();
}

export async function triggerEventScrape(
  workspaceId: string,
  eventId: string
): Promise<{ success: boolean; summary: { totalScraped: number; newLeadsSaved: number } }> {
  const res = await fetch(`${API_URL}/events/${eventId}/trigger`, {
    method: 'POST',
    headers: {
      'x-workspace-id': workspaceId,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to trigger on-demand event scrape');
  }

  return res.json();
}

export async function deleteSearchEvent(workspaceId: string, eventId: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_URL}/events/${eventId}`, {
    method: 'DELETE',
    headers: {
      'x-workspace-id': workspaceId,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to delete search event');
  }

  return res.json();
}

export async function fetchEventLeads(
  workspaceId: string,
  eventId: string
): Promise<{ success: boolean; eventId: string; total: number; leads: EventLeadItem[] }> {
  const res = await fetch(`${API_URL}/events/${eventId}/leads`, {
    headers: {
      'x-workspace-id': workspaceId,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to retrieve dedicated event leads');
  }

  return res.json();
}
