import { authHeaders } from './auth-headers';
import type { ProfileResponse } from '@/types/profile.interface';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function getProfile(): Promise<ProfileResponse> {
  const res = await fetch(`${API_URL}/me`, { headers: await authHeaders() });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to load profile');
  }
  const body = await res.json();
  return body.data as ProfileResponse;
}
