'use client';

interface ClerkGlobal {
  session?: { getToken: () => Promise<string | null> } | null;
}

/** Current Clerk session token, or null when signed out / Clerk not configured. */
export async function getSessionToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const clerk = (window as Window & { Clerk?: ClerkGlobal }).Clerk;
  return (await clerk?.session?.getToken()) ?? null;
}

export async function authHeaders(): Promise<Record<string, string>> {
  const token = await getSessionToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
