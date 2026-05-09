/**
 * Strip HTML tags and normalize whitespace from a string.
 * Used to clean product descriptions before storing.
 */
export function cleanText(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw
    .replace(/<[^>]+>/g, ' ')          // strip HTML tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')              // collapse whitespace
    .trim();
}
