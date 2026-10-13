const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface GenerateLeadsPayload {
  demographic: string;
  campaignId?: string;
  maxPerQuery?: number;
}

export async function generateLeads(workspaceId: string, payload: GenerateLeadsPayload) {
  const response = await fetch(`${API_URL}/leads/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-workspace-id': workspaceId,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate leads');
  }

  return response.json();
}

export async function fetchLeads(workspaceId: string) {
  const response = await fetch(`${API_URL}/leads`, {
    headers: {
      'x-workspace-id': workspaceId,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch leads');
  }

  return response.json();
}

export async function generateBrochure(workspaceId: string, leadId: string) {
  const response = await fetch(`${API_URL}/ai/pitch-brochure`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-workspace-id': workspaceId,
    },
    body: JSON.stringify({ leadId }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate PDF brochure');
  }

  return response.json();
}

export async function simulateWebhookReply(payload: {
  workspaceId: string;
  replyText: string;
  leadId?: string;
  campaignId?: string;
}) {
  const response = await fetch(`${API_URL}/webhooks/email-replies`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return response.json();
}
