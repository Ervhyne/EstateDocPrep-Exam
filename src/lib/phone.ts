/**
 * Normalizes a phone number for storage/lookup: trims whitespace and strips
 * everything except leading "+" and digits, so "(555) 010-0100" and
 * "555 010 0100" match the same guest record.
 */
export function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  const hasLeadingPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  return hasLeadingPlus ? `+${digits}` : digits;
}
