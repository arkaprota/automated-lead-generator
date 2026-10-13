export function normalizePhoneNumber(rawPhone?: string | null): string | null {
  if (!rawPhone) return null;
  // Strip all non-digit and non-plus characters
  const cleaned = rawPhone.replace(/[^\d+]/g, '').trim();
  return cleaned.length >= 7 ? cleaned : null;
}
