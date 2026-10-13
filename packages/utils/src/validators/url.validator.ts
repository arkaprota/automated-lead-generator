export function isValidUrl(rawUrl?: string | null): boolean {
  if (!rawUrl) return false;
  try {
    const url = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
