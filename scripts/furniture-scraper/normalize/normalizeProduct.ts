/**
 * Normalize a raw scraped product into the NormalizedFurnitureProduct shape
 * used by the existing upsertProduct function.
 *
 * This wraps the existing src/lib/ingestion/normalizeProduct.ts logic
 * and adds the new inference functions.
 */
import { toNormalizedProduct } from '../../../src/lib/ingestion/normalizeProduct';
import type { NormalizedFurnitureProduct, StoreInput, SourcePlatform } from '../../../src/lib/ingestion/types';
import { inferColors } from './inferColors';
import { inferMaterials } from './inferMaterials';
import { inferStyles, inferAestheticTags } from './inferStyles';
import { inferFurnitureType } from './inferFurnitureType';
import { parseDimensions } from './parseDimensions';
import { cleanText } from '../utils/cleanText';
import { absoluteUrl, normalizeUrl } from '../utils/absoluteUrl';
import { normalizePrice } from '../utils/normalizePrice';

export interface RawProduct {
  title: string;
  description?: string | null;
  product_url: string;
  image_url?: string | null;
  image_urls?: string[];
  price?: string | number | null;
  compare_at_price?: string | number | null;
  currency?: string;
  brand?: string | null;
  sku?: string | null;
  external_id?: string | null;
  category?: string | null;
  tags?: string[];
  options?: string[];
  dimensions_text?: string | null;
  availability?: string | null;
  source_platform: SourcePlatform;
  store: StoreInput;
  raw_payload: Record<string, unknown>;
  base_url?: string;
}

export function normalizeScrapedProduct(raw: RawProduct): NormalizedFurnitureProduct {
  const base = raw.base_url ?? raw.store.website ?? '';

  // Resolve URLs
  const productUrl = absoluteUrl(raw.product_url, base);
  const imageUrl   = raw.image_url ? absoluteUrl(raw.image_url, base) : undefined;
  const imageUrls  = (raw.image_urls ?? [])
    .map(u => absoluteUrl(u, base))
    .filter(Boolean);

  // Clean description
  const description = cleanText(raw.description);

  // Prices
  const price         = normalizePrice(raw.price);
  const comparePrice  = normalizePrice(raw.compare_at_price);
  const originalPrice = comparePrice && price && comparePrice > price ? comparePrice : undefined;

  // Infer attributes
  const allText = `${raw.title} ${description} ${(raw.tags ?? []).join(' ')} ${(raw.options ?? []).join(' ')}`;
  const colors    = inferColors(raw.title, description, raw.options);
  const materials = inferMaterials(raw.title, description, raw.options);
  const styles    = inferStyles(raw.title, description, raw.tags);
  const aesthetics = inferAestheticTags(raw.title, description, raw.tags);
  const furnitureType = inferFurnitureType(raw.title, description);

  // Parse dimensions
  const dimensions = raw.dimensions_text
    ? parseDimensions(raw.dimensions_text) ?? undefined
    : undefined;

  return toNormalizedProduct({
    title:           raw.title.trim(),
    description:     description || undefined,
    product_url:     productUrl,
    image_url:       imageUrl,
    additional_images: imageUrls.slice(1),
    price:           price ?? undefined,
    original_price:  originalPrice,
    currency:        raw.currency ?? 'CAD',
    brand:           raw.brand ?? raw.store.name,
    sku:             raw.sku ?? raw.external_id ?? undefined,
    colors,
    materials,
    styles:          [...styles, ...aesthetics],
    dimensions:      dimensions ?? (raw.dimensions_text ? { raw_dimensions_text: raw.dimensions_text, unit: 'cm' } : undefined),
    availability:    mapAvailability(raw.availability),
    condition:       'new',
    source_platform: raw.source_platform,
    store:           raw.store,
    raw_payload:     {
      ...raw.raw_payload,
      furniture_type: furnitureType,
      scraped_at: new Date().toISOString(),
    },
  });
}

function mapAvailability(raw?: string | null): 'in_stock' | 'out_of_stock' | 'limited' | 'unknown' {
  if (!raw) return 'unknown';
  const lower = raw.toLowerCase();
  if (lower.includes('in stock') || lower === 'true' || lower === 'available') return 'in_stock';
  if (lower.includes('out') || lower === 'false' || lower === 'unavailable') return 'out_of_stock';
  if (lower.includes('limited') || lower.includes('low')) return 'limited';
  return 'unknown';
}
