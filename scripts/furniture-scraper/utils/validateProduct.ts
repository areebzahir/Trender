/**
 * Validate a scraped product before inserting into Supabase.
 * Returns null if valid, or an error string if invalid (should be skipped).
 */
export interface RawScrapedProduct {
  title?: string | null;
  product_url?: string | null;
  image_url?: string | null;
  image_urls?: string[];
  price?: number | null;
}

export function validateProduct(p: RawScrapedProduct): string | null {
  if (!p.title || p.title.trim().length < 2) {
    return 'Missing or too-short title';
  }
  if (!p.product_url || !isValidUrl(p.product_url)) {
    return 'Missing or invalid product_url';
  }
  const hasImage = (p.image_url && isValidUrl(p.image_url)) ||
    (p.image_urls && p.image_urls.length > 0 && isValidUrl(p.image_urls[0]));
  if (!hasImage) {
    return 'Missing image_url and image_urls';
  }
  return null; // valid
}

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}
