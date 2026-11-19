import { authHeaders } from './auth-headers';
import type { LlmProvider } from '../types/llm-provider.enum';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface AvailableProvider {
  id: LlmProvider;
  label: string;
  configured: boolean;
}

export interface AiProviderResponse {
  provider: LlmProvider;
  availableProviders: AvailableProvider[];
}

export async function getAiProvider(workspaceId: string): Promise<AiProviderResponse> {
  const res = await fetch(`${API_URL}/workspace/ai-provider`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch AI provider setting');
  const data = await res.json();
  return data.data as AiProviderResponse;
}

export async function setAiProvider(workspaceId: string, provider: LlmProvider): Promise<LlmProvider> {
  const res = await fetch(`${API_URL}/workspace/ai-provider`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(await authHeaders()),
    },
    body: JSON.stringify({ provider }),
  });
  if (!res.ok) throw new Error('Failed to update AI provider setting');
  const data = await res.json();
  return data.data.provider as LlmProvider;
}
