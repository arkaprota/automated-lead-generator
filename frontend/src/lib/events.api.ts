import { authHeaders } from './auth-headers';
import type { SearchEventItem, CreateEventPayload, EventLeadItem } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export type { SearchEventItem, CreateEventPayload, EventLeadItem };

export async function fetchEvents(workspaceId: string, status?: string): Promise<{ success: boolean; events: SearchEventItem[] }> {
  const url = new URL(`${API_URL}/events`);
  if (status) url.searchParams.append('status', status);

  const res = await fetch(url.toString(), {
    headers: {
      ...(await authHeaders()),
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
      ...(await authHeaders()),
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
      ...(await authHeaders()),
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
      ...(await authHeaders()),
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
      ...(await authHeaders()),
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
      ...(await authHeaders()),
    },
  });

  if (!res.ok) {
    throw new Error('Failed to retrieve dedicated event leads');
  }

  return res.json();
}
