/**
 * Parse a price value from various formats into a CAD number.
 * Returns null if unparseable.
 *
 * Handles: "$1,299.00", "CAD 899", "1299", 1299, "1,299.99 CAD"
 */
export function normalizePrice(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  if (typeof raw === 'number') return isFinite(raw) ? Math.round(raw * 100) / 100 : null;

  // Shopify stores prices as strings like "1299.00"
  const cleaned = String(raw)
    .replace(/[^0-9.]/g, '')  // strip everything except digits and decimal
    .trim();

  if (!cleaned) return null;
  const parsed = parseFloat(cleaned);
  return isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) / 100 : null;
}
