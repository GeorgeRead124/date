/**
 * Small shared helpers for validating puzzle answers across scenes.
 * Kept separate so puzzle logic isn't duplicated / hardcoded inline.
 */

export function normalizeAnswer(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^\w\s]/g, "");
}

export function isAnswerAccepted(raw: string, accepted: string[]): boolean {
  const normalized = normalizeAnswer(raw);
  if (!normalized) return false;
  return accepted.some((a) => normalized.includes(normalizeAnswer(a)));
}
