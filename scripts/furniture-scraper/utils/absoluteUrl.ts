/**
 * Convert a relative URL to an absolute URL given a base.
 * Returns the original string if it's already absolute or unparseable.
 */
export function absoluteUrl(url: string | null | undefined, base: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  try {
    return new URL(trimmed, base).toString();
  } catch {
    return trimmed;
  }
}

/**
 * Normalize a URL: strip tracking params, trailing slashes.
 */
export function normalizeUrl(raw: string): string {
  try {
    const url = new URL(raw.trim());
    const TRACKING = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
      'ref', 'source', 'fbclid', 'gclid', 'msclkid', '_ga',
    ];
    TRACKING.forEach(p => url.searchParams.delete(p));
    return url.toString().replace(/\/$/, '');
  } catch {
    return raw.trim().replace(/\/$/, '');
  }
}
